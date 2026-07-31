import e, { request } from 'express';
import pool from '../config/db.js';
import { verifyTokenInDB } from '../userAuth/logic.js';

const LIMIT = 20;

// ----- Product Functions ----- //
export const addProducts = async (data) => { // change data
    const parent = data.parent || null;
    const sku = data.sku || null;
    
    if (!parent && !sku)
        return {
            success: false,
            error:"Paramater Mising"
        };

    const client = await pool.connect();
    try{
        await client.query("BEGIN")
        
        const query = 'INSERT INTO products (parent_sku, sku) VALUES ($1, $2) RETURNING sku';
        const result = await client.query(query, [parent, sku]);
        await client.query("COMMIT")
        return { 
            success: true,
            result: result.rows[0]
        };
    }
    catch(error){
        if(error.code == '23505')
            console.error(`Duplicate entry: ${error.detail}`);
        await client.query("ROLLBACK");
        throw error;
    }
    finally{
        await client.release();
    }
}

export const getProducts = async (search, order, page = 0) => {
    try{
        search = search || null;
        order = order || true;
        
        var query = `SELECT * FROM products `;
        const condition = [];
        const param = [];

        var id = 0;
        if(search){
            id++;
            condition.push(`(parent_sku LIKE $${id} OR sku LIKE $${id})`);
            param.push(`%${search}%`);
        }

        condition.push(`order by created_at ${order ? "DESC":"ASC"} LIMIT ${LIMIT} OFFSET ${page}`);
        
        if(id>=1){
            query += "WHERE "
        }
        query = query + condition.join(" ");

        const result = await pool.query(query, param);
        return {
            success: true,
            result: result.rows
        };
    }
    catch(error){
        throw error;
    }
}

// ----- Stock Functions ----- //
const modifyStocks = async (pool, sku, rak, qty) => {
    if(!pool || !sku || !rak || !qty)
        throw `Function modifyStocks cannot have empty fields! (pool : ${pool}, sku : ${sku}, rak : ${rak}, qty : ${qty})`;
    
    if(!typeof qty === 'number' || !Number.isFinite(qty))
        throw `Quantity must be finite number! (quantity : ${qty})`;

    try{
        const queryProduct = `SELECT id FROM products WHERE sku = $1`;
        const product = await pool.query(queryProduct, [sku]);
    
        if(product.rows.length <= 0){
            return {
                success: false,
                error: "Product Name Doesn't exist"
            };
        }
        
        const queryStock = "SELECT id, quantity FROM stocks WHERE product_id = $1 AND rak = $2";
        const stock = await pool.query(queryStock, [product.rows[0].id, rak]);
        
        var startQty = 0;
        var result;
        if(stock.rows.length <= 0){
            if(qty < 0){
                return {
                    success: false,
                    error: `Stocks quantity cannot be below 0`
                };
            }
            const query = 'INSERT INTO stocks (product_id, rak, quantity) VALUES ($1, $2, $3) RETURNING *';
            result = await pool.query(query, [product.rows[0].id, rak, qty]);
        }
        else{
            startQty = stock.rows[0].quantity;
            if(startQty + qty < 0){
                return {
                    success: false,
                    error: `Stocks quantity cannot be below 0`
                };
            }
            const query = 'UPDATE stocks SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
            result = await pool.query(query, [qty, stock.rows[0].id]);
        }
        const endQty = result.rows[0].quantity;

        return {
            success: true,
            result: result.rows[0],
            data: {
                startQty: startQty,
                endQty: endQty
            }
        };
    }
    catch(error){
        throw error;
    }
}

export const getStocks = async (search, order, page) => {
    try{        
        var query = `
        SELECT p.sku, s.rak, s.quantity, s.updated_at 
        FROM stocks as s 
        INNER JOIN products as p ON s.product_id = p.id `;

        const param = [];
        
        if(search){
            query += "WHERE p.sku LIKE $1 OR s.rak LIKE $1 ";
            param.push(`%${search}%`);
        }

        query += `order by s.updated_at ${order? 'DESC' :'ASC'} LIMIT ${LIMIT} OFFSET ${page}`;

        const result = await pool.query(query, param);
        return {
            success: true,
            result: result.rows
        };
    }
    catch(error){
        throw error;
    }
}

// -------- LOGS FUNCTIONS ---------- //
/**
 * 
 * @param {import('pg').Pool} pool REQUIRED
 * @param {string} sku REQUIRED
 * @param {String} rak REQUIRED
 * @param {number} starting_quantity 
 * @param {number} quantity_change REQUIRED
 * @param {number} ending_quantity 
 * @param {string} type REQUIRED
 * @param {string} surat_jalan 
 * @param {string} resi 
 * @param {string} invoice 
 * @param {string} channel 
 * @param {string} desc REQUIRED
 * @param {string} username REQUIRED
 * @returns {Object}
 */
export const addAuditTrail = async (pool, sku, rak, starting_quantity, quantity_change, ending_quantity, type, surat_jalan, resi, invoice, channel, desc, username) => {
    if(!pool || !sku || !rak || !quantity_change || !type || !desc || !username){
        return{
            success: false,
            error: "Missing a Required Paramater when Logging!"
        };
    }

    try{
        const query = `INSERT INTO audit_trail 
                        (sku, rak, starting_quantity, quantity_change, ending_quantity, type, surat_jalan, resi, invoice, channel, description, username, loged_at) 
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) 
                        RETURNING sku, ending_quantity`;
        const result = await pool.query(query,[sku, rak, starting_quantity, quantity_change, ending_quantity, type, surat_jalan, resi, invoice, channel, desc, username]);
    
        return {
            success: true,
            result: result
        };
    }
    catch(error){
        throw error;
    }
}

/**
 * 
 * @param {string} search Search for SKU and rak
 * @param {string} type LOGTYPE (inbound | outbound | return | reject | move_from | move_to)
 * @param {boolean} order Order by timestamp. Value true : "DESC" | false : "ASC"
 * @param {number} page SQL Pagination. 
 * @returns {Promise<{success: number, result?: Array, error: string}>}
 */
export const getAuditTrail = async (search, type, order, page = 0) => {
    try{
        var query = `SELECT * FROM audit_trail `;
        const condition = [];
        const param = [];

        var id = 0;
        if(search){
            condition.push(`(sku LIKE $${++id} OR rak LIKE $${id})`);
            param.push(`%${search}%`);
        }

        if(type){
            if(id++ >= 1) condition.push('AND');
            condition.push(`type = $${id}`)
            param.push(type)
        }

        condition.push(`order by loged_at ${order ? "ASC":"DESC"} LIMIT ${LIMIT} OFFSET ${page}`);
        
        if(id>=1)
            query += "WHERE ";

        query = query + condition.join(" ");

        const result = await pool.query(query, param);
        return {
            success: true,
            result: result.rows
        };
    }
    catch(error){
        throw error;
    }
}

// Main FEATURE //
export const addInbound = async (sku, rak, qty, surat_jalan, username) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const stock = await modifyStocks(client, sku, rak, Math.abs(qty));
        
        if(!stock.success){
            await client.query("ROLLBACK");
            return stock;
        }
        
        const desc = `<Inbound> ${sku} (${qty}) to ${rak}. ${stock.data.endQty} now`;
        const logs = await addAuditTrail(client, sku, rak, stock.data.startQty, qty, stock.data.endQty, "inbound", surat_jalan, null, null, null, desc, username);
        if(!logs.success){
            await client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY ADDED inbound DATA:\n ${JSON.stringify(stock.result)}`);
        return { success: true };
    }
    catch(error){
        await client.query("ROLLBACK");
        throw error;
    }
    finally{
        await client.release();
    }
}

export const addOutbound = async (sku, rak, qty, resi, channel, username) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const stock = await modifyStocks(client, sku, rak, -Math.abs(qty));
        
        if(!stock.success){
            await client.query("ROLLBACK");
            return stock;
        }

        const desc = `<Outbound> ${sku} (${qty}) from ${rak}. ${stock.data.endQty} Left`;
        const logs = await addAuditTrail(client, sku, rak, stock.data.startQty, qty, stock.data.endQty, "outbound", null, resi, null, channel, desc, username);
        if(!logs.success){
            await client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY ADDED outbound DATA:\n ${JSON.stringify(stock.result)}`);
        return { success: true };
    }
    catch(error){
        await client.query("ROLLBACK");
        throw error;
    }
    finally{
        await client.release();
    }
}

export const addReturReject = async (sku, rak, qty, invoice, type, channel, desc, username) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const stock = await modifyStocks(client, sku, rak, Math.abs(qty));
        
        if(!stock.success){
            await client.query("ROLLBACK");
            return stock;
        }

        var logs;
        if(type == "retur"){
            logs = await addAuditTrail(client, sku, rak, stock.data.startQty, qty, stock.data.endQty, "return", null, null, invoice, channel, desc, username);
        }
        else if (type == "reject"){
            logs = await addAuditTrail(client, sku, rak, stock.data.startQty, qty, stock.data.endQty, "reject", null, null, invoice, channel, desc, username);
        }

        if(!logs.success){
            await client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY ADDED Return/Reject DATA:\n ${JSON.stringify(result.rows[0])}`);
        return { success: true };
    }
    catch(error){
        await client.query("ROLLBACK");
        throw error;
    }
    finally{
        await client.release();
    }
}

// --- Request Functions --- //

const getUser = async (userToken) => {
    if(!userToken){
        return{
            valid: false,
            error: "User Token is Required"
        };
    }
    try{
        const validity = await verifyTokenInDB(userToken);
        if(!validity.valid){
            return {
                valid: false,
                error: validity.error
            };
        }
        const user = await pool.query("SELECT username FROM users WHERE id = $1", [validity.user_id]);
        return {
            valid: true,
            id: validity.user_id,
            name: user.rows[0].username
        };
    }
    catch(error){
        console.log(error);
        throw error;
    }
}

// status = 0:"Pending" | 1:"Rejected" | 2:"Accepted"
/**
 * 
 * @param {string} userToken 
 * @param {number} status 0 : "Pending" | 1 : "Rejected" | 2 : "Accepted"
 * @returns {Promise<{success: boolean, error?: string, result?: string}>}
 */
export const getRequest = async (userToken, status = 0) => {
    if(!userToken){
        return{
            success: false,
            error: "User Token is Required"
        };
    }

    try{        
        const validity = await verifyTokenInDB(userToken);
        if (!validity.valid){
            return {
                success: false,
                error:"User Token expired or invalid"
            }
        }
        
        if(status >= 3 || status < 0) status = 0;
        
        const query = `
        SELECT p.sku, s.rak, r.rak_change, r.quantity_change, u.username, r.request_at, r.acceptance_status
         FROM requests as r
         INNER JOIN stocks as s ON r.stock_id = s.id
         INNER JOIN products as p ON s.product_id = p.id
         INNER JOIN users as u ON r.requested_by = u.id
         WHERE acceptance_status = $1
        `;
    
        const result = await pool.query(query, [status]);
        return {
            success: true,
            result: result.rows
        };
    }
    catch(error){
        throw error;
    }
}

export const createRequest = async (stockId, userToken, qty, type, desc, rakTo = null) => { // Add to Logs? or new Log type
    if(!stockId || !userToken || !qty || !type || !desc){
        console.warn(`createRequest input = ${stockId} || ${userToken} || ${qty} || ${type} || ${desc}`);
        return{
            success: false,
            error: "Missing a Required Paramater when Creating Request"
        };
    }

    try{
        type = type.toLowerCase();

        const queryStock = `SELECT 1 FROM stocks WHERE id = $1`;
        const stockExist = await pool.query(queryStock, [stockId]); // Maybe use SKU & Rak
        if(stockExist.rows.length <= 0){
            return {
                success: false,
                error: "Stock ID doesn't exist"
            };
        }

        const user = await getUser(userToken);
        if(!user.valid){
            console.warn(user.error);
            return {
                success: false,
                error: user.error
            };
        }

        var result;
        if(type == 'move'){
            const query = `INSERT INTO requests(type, stock_id, requested_by, quantity_change, rak_change, description) VALUES
                            ('move' ,$1, $2, $3, $4, $5)`;
    
            result = await pool.query(query, [stockId, user.id, qty, rakTo, desc]);
            console.log(`SUCCSESFULLY CREATED request: ${qty} stock id: ${stockId} to ${rakTo}`);
        }
        else if (type == 'adjust'){
            const query = `INSERT INTO requests(type, stock_id, requested_by, quantity_change, description) VALUES
                            ('adjust' ,$1, $2, $3, $4)`;
    
            result = await pool.query(query, [stockId, user.id, qty, desc]);
            console.log(`SUCCSESFULLY CREATED request (adjusment): ${qty} stock id: ${stockId}`);
        }
        
        return { success: true };
    }
    catch(error){
        throw error;
    }
}

export const createRequestwSku = async (sku, rakFrom, userToken, qty, type, desc, rakTo = null) => { // Add to Logs? or new Log type
    if(!sku || !rakFrom || !userToken || !qty || !type || !desc){
        console.warn(`createRequestwSku input = ${sku} || ${rakFrom} || ${userToken} || ${qty} || ${type} || ${desc}`);
        return{
            success: false,
            error: "Missing a Required Paramater when Creating Request"
        };
    }
    try{
        const queryStock = `SELECT s.id 
                            FROM stocks as s 
                            INNER JOIN products as p ON s.product_id = p.id
                            WHERE p.sku = $1 AND s.rak = $2 `;
        const stockId = await pool.query(queryStock, [sku, rakFrom]);
        
        if(stockId.rows.length <= 0){
            return {
                success: false,
                error: "Stock doesn't exist"
            };
        }
        
        return await createRequest(stockId.rows[0].id, userToken, qty, type, desc, rakTo);
    }
    catch(error){
        throw error;
    }
}

const resolveRequestMove = async (pool, sku, rakFrom, rakTo, qty, desc, username) => {
    if(!pool || !sku || !rakFrom || !rakTo || !qty || !desc || !username)
        throw `Function resolveRequestMove cannot have empty fields! (pool : ${pool}, sku : ${sku}, rakFrom : ${rakFrom}, rakTo : ${rakTo}, qty : ${qty}, username : ${username})`;

    try{
        const moveFrom = await modifyStocks(pool, sku, rakFrom, -qty);
        if(!moveFrom.success)
            return moveFrom;
        const logFrom = await addAuditTrail(pool, sku, rakFrom, moveFrom.data.startQty, -qty, moveFrom.data.endQty, 'move_from', null, null, null, null, desc, username);
        if(!logFrom.success)
            return logFrom;

        const moveTo = await modifyStocks(pool, sku, rakTo, qty);
        if(!moveTo.success)
            return moveTo;
        const logTo = await addAuditTrail(pool, sku, rakTo, moveTo.data.startQty, qty, moveTo.data.endQty, 'move_to', null, null, null, null, desc, username);
        if(!logTo.success)
            return logTo;

        return { success : true };
    }
    catch(error){
        throw error;
    }
}

const resolveRequestAdjust = async (pool, sku, rak, qty, desc, username) => {
    if(!pool || !sku || !rak || !qty || !desc || !username)
        throw `Function resolveRequestAdjust cannot have empty fields! (pool : ${pool}, sku : ${sku}, rak : ${rak}, qty : ${qty}, username : ${username})`;

    try{
        const adjusment = await modifyStocks(pool, sku, rak, qty);
        if(!adjusment.success)
            return adjusment;
        const log = await addAuditTrail(pool, sku, rak, adjusment.data.startQty, -qty, adjusment.data.endQty, 'adjusment', null, null, null, null, desc, username);
        if(!log.success)
            return log;

        return { success : true };
    }
    catch(error){
        throw error;
    }
}

export const resolveRequest = async (userToken, requestId, accept) => {
    if(!userToken || !requestId){
        return{
            success: false,
            error: "Missing a Required Paramater when Resolving Request"
        };
    }
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const queryRequest = `SELECT r.stock_id, u.username, r.rak_change, r.quantity_change, r.type, r.acceptance_status, r.description
                                FROM requests as r 
                                INNER JOIN users as u ON r.requested_by = u.id
                                WHERE r.id = $1`;
        const request = await client.query(queryRequest, [requestId]);
        if(request.rows.length <= 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Request ID doesn't exist"
            };
        }
        if(request.rows[0].acceptance_status != 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Request already resolved"
            };
        }
        
        const queryStock = `SELECT p.sku, s.rak
                                FROM stocks as s 
                                INNER JOIN products as p ON s.product_id = p.id 
                                WHERE s.id = $1`
        const stock = await client.query(queryStock, [request.rows[0].stock_id]);
        if(stock.rows.length <= 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Stock doesn't exist"
            };
        }
        
        const user = await getUser(userToken);
        if(!user.valid){
            console.warn(user.error);
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "User ID doesn't exist"
            };
        }

        const queryUpdateReq = `UPDATE requests SET accepted_by = $1, acceptance_status = $2, accepted_at = NOW() WHERE id = $3 RETURNING *`;
        const resultRequest = await client.query(queryUpdateReq, [user.id, accept? 2 : 1, requestId]);
        
        if(!accept){
            await client.query("COMMIT");
            console.log(`SUCCSESFULLY UPDATED request: ${requestId} DENIED`);
            return{ success: true };
        }

        var result = false;
        if(request.rows[0].type == 'move'){
            result = await resolveRequestMove(client, stock.rows[0].sku, stock.rows[0].rak, request.rows[0].rak_change, request.rows[0].quantity_change, request.rows[0].description, request.rows[0].username);
        }
        else if(request.rows[0].type == 'adjust'){
            result = await resolveRequestAdjust(client, stock.rows[0].sku, stock.rows[0].rak, request.rows[0].quantity_change, request.rows[0].description, request.rows[0].username);
        }
        else{
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "invalid request type!"
            }
        }

        if (!result.success){
            await client.query("ROLLBACK");
            return result;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY UPDATED request: ${requestId} ACCEPTED`);
        return { success: true };
    }
    catch(error){
        await client.query("ROLLBACK");
        throw error;
    }
    finally{
        await client.release();
    }
}