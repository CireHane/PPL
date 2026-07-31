import { addInbound, addOutbound, addProducts, addReturReject, createRequest, createRequestwSku, getAuditTrail, getProducts, getRequest, getStocks, resolveRequest } from "./logic.js";

export const addProductsHandler = async (req, res) => {
    try{
        const result = await addProducts(req.body);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        res.status(500).send({
            success: false,
            error: 'Internal server error'
        });   
    }
}

export const getProductsHandler = async (req, res) => {
    try{
        const { search, order, page } = req.body;
        const result = await getProducts(search, order, page);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        res.status(500).send({
            success: false,
            error: 'Internal server error'
        });   
    }
}

export const getStocksHandler = async (req, res) => {
    try{
        const search = req.body.search || null;
        const order = req.body.order || true;
        const page = req.body.page || 0;

        const result = await getStocks(search, order, page);
        if(!result.success){
            return res.status(400).send(result);
        }
        else{
            return res.status(200).send(result);
        }
    }
    catch(error){
        console.error(error);
        return res.status(500).send({
            success: false,
            error: 'Internal server error'
        });   
    }
}

export const inboundHandler = async (req, res) => {
    const { sku, rak, qty, surat_jalan, user } = req.body;
    if(!sku || !rak || !qty || !surat_jalan || !user){
        return res.status(400).send({
            success: false,
            error: "Missing required fields"
        });
    }
    try{
        const result = await addInbound(sku, rak, qty, surat_jalan, user);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        res.status(500).send({
            success: false,
            error: 'Internal Server Error'
        });
    }
}

 export const outboundHandler = async (req, res) => {
    const { sku, rak, qty, resi, channel, user } = req.body;
    if(!sku || !rak || !qty || !resi || !channel || !user){
        return res.status(400).send({
            success: false,
            error: "Missing required fields"
        });
    }
    try{
        const result = await addOutbound(sku, rak, qty, resi, channel, user);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        return res.status(500).send({
            success: false,
            error: 'Internal Server Error'
        });
    }
}

 export const returRejectHandler = async (req, res) => {
    const { sku, rak, qty, invoice, type, channel, desc, user } = req.body;
    if(!sku || !rak || !qty || !invoice || !type || !channel || !desc || !user){
        return res.status(400).send({
            success: false,
            error: "Missing required fields"
        });
    }
    const cleanType = type.replace(/\s+/g, "").toLowerCase();
    if(cleanType != "retur" && cleanType != "reject"){
        console.warn(`Input for returRejectHandler was invalid. Input = ${cleanType}`);
        return res.status(400).send({
            success: false,
            error: `Type must be 'retur' or 'reject'.`
        });
    }
    
    try{
        const result = await addReturReject(sku, rak, qty, invoice, cleanType, channel, desc, user);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        res.status(500).send({
            success: false,
            error: 'Internal Server Error'
        });
    }
}

export const getAuditTrailHandler = async (req, res) => {
    const { search, type, order, page } = req.body;
    try{
        const pageClean = page > 0 ? 0 : page;
        const result = await getAuditTrail(search, type, order, pageClean);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        return res.status(500).send({
            success: false,
            error: 'Internal server error'
        });
    }
}

export const getRequestHandler = async (req, res) => {
    const { userToken, status } = req.body;
    if(!userToken){
        return res.status(400).send({
            success: false,
            error: 'Missing required field'
        });
    }
    
    try{
        const result = await getRequest(userToken, status);
        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        return res.status(500).send({
            success: false,
            error: 'Internal server error'
        });   
    }
}

export const createRequestHandler = async (req, res) => {
    const { stockId, sku, rakFrom, userToken, qty, type, desc, rakTo } = req.body;
    if(!userToken || !qty || !type || !desc){
        return res.status(400).send({
            success: false,
            error: 'Missing required fields'
        });
    }

    const cleanType = type.replace(/\s+/g, "").toLowerCase();
    if(cleanType != 'move' && cleanType != 'adjust'){
        console.warn(`Input for createRequestHandler was invalid. Input = ${cleanType}`);
        return res.status(400).send({
            success: false,
            error: `Type must be 'move' or 'adjust'.`
        });
    }

    if(!rakTo && cleanType == 'move'){
        console.warn(`Missing rak destination on move request. Input = ${rakTo}`);
        return res.status(400).send({
            success: false,
            error: `Request to move must have a destination!`
        });
    }
    try{
        var result;
        if(stockId)
            result = await createRequest(stockId, userToken, qty, cleanType, desc, rakTo);
        else if(sku && rakFrom)
            result = await createRequestwSku(sku, rakFrom, userToken, qty, cleanType, desc, rakTo);
        else{
            return res.status(400).send({
                success: false,
                error: 'Must target a stock'
            })
        }

        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        res.status(500).send({
            success: false,
            error: 'Internal Server Error'
        });
    }
}

export const resolveRequestHandler = async (req, res) => {
    const { userToken, requestId, accept } = req.body;
    if(!userToken || !requestId){
        return res.status(400).send({
            success: false,
            error: 'Missing required fields'
        });
    }

    if(typeof accept !== "boolean"){
        console.warn(`accept was not boolean. Input = ${accept}`);
        return res.status(400).send({
            success: false,
            error: `accept field must be boolean type.`
        });
    }

    try{
        const result = await resolveRequest(userToken, requestId, accept);

        if(!result.success)
            return res.status(400).send(result);
        else
            return res.status(200).send(result);
    }
    catch(error){
        console.error(error);
        res.status(500).send({
            success: false,
            error: 'Internal Server Error'
        });
    }
}