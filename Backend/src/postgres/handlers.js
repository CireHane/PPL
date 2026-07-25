import { addInbound, addOutbound, addProducts, addReturReject, getAuditTrail, getProducts, getStocks } from "./logic.js";

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
        const result = await getProducts(req.body);
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
        const result = await getStocks(req.body);
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
        return res.status(400).send({
            success: false,
            error: `Type must be 'retur' or 'reject'. Input was ${cleanType}`
        });
    }
    
    try{
        const result = await addReturReject(sku, rak, qty, invoice, type, channel, desc, user);
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
    try{
        
        const result = await getAuditTrail(req.body);
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
            error: 'Internal server error:'
        });   
    }
}