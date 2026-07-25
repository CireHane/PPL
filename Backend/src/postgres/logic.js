import e from 'express';
import pool from '../config/db.js';
import { createQuery } from '../config/util.js';

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
        await client.release
    }
}

export const getProducts = async (data) => {
    try{
        const search = data.search || null;
        const order = data.order || true;
        
        var query = `SELECT * FROM products `;
        const condition = [];
        const param = [];

        var id = 0;
        if(search){
            id++;
            condition.push(`(parent_sku LIKE $${id} OR sku LIKE $${id})`);
            param.push(`%${search}%`);
        }

        condition.push(`order by created_at ${order ? "DESC":"ASC"}`)
        
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
export const getStocks = async (data) => {
    try{
        const search = data.search || null;
        const order = data.order || true;
        
        var query = `
        SELECT p.sku, s.rak, s.quantity, s.updated_at 
        FROM stocks as s 
        INNER JOIN products as p ON s.product_id = p.id `;

        const param = [];
        
        if(search){
            query += "WHERE p.sku LIKE $1 OR s.rak LIKE $1 ";
            param.push(`%${search}%`);
        }

        query += `order by s.updated_at ${order? 'DESC' :'ASC'}`

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
 * @param {string} user REQUIRED
 * @returns {Object}
 */
export const addAuditTrail = async (pool, sku, rak, starting_quantity, quantity_change, ending_quantity, type, surat_jalan, resi, invoice, channel, desc, user) => {
    if(!pool || !sku || !rak || !quantity_change || !type || !desc || !user){
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
        const result = await pool.query(query,[sku, rak, starting_quantity, quantity_change, ending_quantity, type, surat_jalan, resi, invoice, channel, desc, user]);
    
        return {
            success: true,
            result: result
        };
    }
    catch(error){
        throw error;
    }
}

export const getAuditTrail = async (data) => {
    try{
        const search = data.search || null;
        const type = data.type || null;
        const orderNew = data.order || true;
        
        var query = `SELECT * FROM audit_trail `;
        const condition = [];
        const param = [];

        var id = 0;
        if(search){
            id++;
            condition.push(`(sku LIKE $${id} OR rak LIKE $${id})`);
            param.push(`%${search}%`);
        }

        if(type){
            if(id >= 1) condition.push('AND');
            id++;
            condition.push(`type = $${id}`)
            param.push(type)
        }

        condition.push(`order by loged_at ${orderNew ? "DESC":"ASC"}`)
        
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

// Main FEATURE //
export const addInbound = async (sku, rak, qty, surat_jalan, user) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const queryProduct = `SELECT id FROM products WHERE sku = $1`;
        const prodId = await client.query(queryProduct, [sku]);

        if(prodId.rows.length <= 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Product Name Doesn't exist"
            };
        }
        const queryStock = "SELECT id, quantity FROM stocks WHERE product_id = $1 AND rak = $2";
        const stockSnap = await client.query(queryStock, [prodId.rows[0].id, rak]);

        if(stockSnap.rows.length > 1){
            console.error(`Found Duplicate on: ${sku}@${rak}:\n${stockSnap.rows}`)
        }

        var startQty = -1;
        var endQty = -1;
        var result;
        if(stockSnap.rows.length <= 0){
            startQty = 0;
            const query = 'INSERT INTO stocks (product_id, rak, quantity) VALUES ($1, $2, $3) RETURNING *';
            result = await client.query(query, [prodId.rows[0].id, rak, qty]);
        }
        else{
            startQty = stockSnap.rows[0].quantity;
            const query = 'UPDATE stocks SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
            result = await client.query(query, [qty, stockSnap.rows[0].id]);
        }
        endQty = result.rows[0].quantity

        const desc = `<Inbound> ${sku} (${qty}) to ${rak}. ${endQty} now`;
        const logs = await addAuditTrail(client, sku, rak, startQty, qty, endQty, "inbound", surat_jalan, null, null, null, desc, user);
        if(!logs.success){
            client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY UPDATED stocks DATA:\n ${JSON.stringify(result.rows[0])}`);
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

export const addOutbound = async (sku, rak, qty, resi, channel, user) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const queryProduct = `SELECT id FROM products WHERE sku = $1`;
        const prodId = await client.query(queryProduct, [sku]);

        if(prodId.rows.length <= 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Product Name Doesn't exist"
            };
        }
        const queryStock = "SELECT id, quantity FROM stocks WHERE product_id = $1 AND rak = $2";
        const stockSnap = await client.query(queryStock, [prodId.rows[0].id, rak]);

        if(stockSnap.rows.length > 1){
            console.error(`Found Duplicate on: ${sku}@${rak}:\n${stockSnap.rows}`)
        }

        var startQty = -1;
        var endQty = -1;
        var result;
        if(stockSnap.rows.length <= 0){
            startQty = 0;
            const query = 'INSERT INTO stocks (product_id, rak, quantity) VALUES ($1, $2, $3) RETURNING *';
            result = await client.query(query, [prodId.rows[0].id, rak, qty]);
        }
        else{
            startQty = stockSnap.rows[0].quantity;
            const query = 'UPDATE stocks SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
            result = await client.query(query, [qty, stockSnap.rows[0].id]);
        }
        endQty = result.rows[0].quantity

        const desc = `<OUTBOUND> ${sku} (${qty}) from ${rak}. ${endQty} Left`;
        const logs = await addAuditTrail(client, sku, rak, startQty, qty, endQty, "outbound", null, resi, null, channel, desc, user);
        if(!logs.success){
            await client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY UPDATED stocks DATA:\n ${JSON.stringify(result.rows[0])}`);
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

export const addReturReject = async (sku, rak, qty, invoice, type, channel, desc, user) => {
    const client = await pool.connect();
    try{
        await client.query("BEGIN");
        const queryProduct = `SELECT id FROM products WHERE sku = $1`;
        const prodId = await client.query(queryProduct, [sku]);

        if(prodId.rows.length <= 0){
            await client.query("ROLLBACK");
            return {
                success: false,
                error: "Product Name Doesn't exist"
            };
        }
        
        const queryStock = "SELECT id, quantity FROM stocks WHERE product_id = $1 AND rak = $2";
        const stockSnap = await client.query(queryStock, [prodId.rows[0].id, rak]);

        var startQty = -1;
        var endQty = -1;
        var result;
        if(stockSnap.rows.length <= 0){
            startQty = 0;
            const query = 'INSERT INTO stocks (product_id, rak, quantity) VALUES ($1, $2, $3) RETURNING *';
            result = await client.query(query, [prodId.rows[0].id, rak, qty]);
        }
        else{
            startQty = stockSnap.rows[0].quantity;
            const query = 'UPDATE stocks SET quantity = quantity + $1, updated_at = NOW() WHERE id = $2 RETURNING *';
            result = await client.query(query, [qty, stockSnap.rows[0].id]);
        }
        endQty = result.rows[0].quantity

        var logs;
        if(type == "retur"){
            logs = await addAuditTrail(client, sku, rak, startQty, qty, endQty, "return", null, null, invoice, channel, desc, user);
        }
        else if (type == "reject"){
            logs = await addAuditTrail(client, sku, rak, startQty, qty, endQty, "reject", null, null, invoice, channel, desc, user);
        }

        if(!logs.success){
            await client.query("ROLLBACK");
            return logs;
        }
        
        await client.query("COMMIT");
        console.log(`SUCCSESFULLY UPDATED stocks DATA:\n ${JSON.stringify(result.rows[0])}`);
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