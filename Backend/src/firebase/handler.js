// firebase.js //
// Module with function for firebase & firestore //
import {initializeFirebaseApp,
        getFirebaseApp,
        inspectFirestore,
        addStock,
        getInbound,
        addInbound,
        getOutbound,
        addOutbound,
        getRak,
        addRak,
        getRetur,
        addRetur,
        getLogs,
        addLogs,
        getStock,
    } from './logic.js'

    
/**
 * Firestore Add to Stock Collection
 * POST /firebase/stock-add
 * Body: { 
 *  sku: string,
 *  order: string (highest || lowest || out || recent)
 * }
 */
export const stock = async (req, res) => {
    
    const { sku, order } = req.body;
    
    const data = await getStock(sku, order);

    if (!data.success){
        res.status(400).send(data);
    }
    
    res.status(200).send(data);
};

/**
 * Firestore Add to Stock Collection
 * POST /firebase/stock-add
 * Body: { 
 *  sku: string,
 *  rak: stirng,
 *  qty: int
 * }
 */
export const stockAdd = async (req, res) => {
    const data = await addStock({
        sku: req.body.sku,
        rak: req.body.rak,
        qty: req.body.qty
    });
    res.send(data);
};

/**
 * Firestore Add Rak
 * POST /firebase/rak-add
 * Body: { 
 *  rak: stirng,
 *  cap: int
 * }
 */
export const rakAdd = async (req, res) => {
    const data = await addRak({
        rak: req.body.rak,
        cap: req.body.cap
    });
    res.send(data);
};

/**
 * Firestore Get inbound data
 * POST /firebase/inbound
 * Body: { 
 *  "sku":String,
 *  "rak":String,
 *  "qty":int,
 *  "type":Stirng,
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const inboundHandler = async (req, res) => {
    const {sku, rak, qty, type, startTime, endTime} = req.body;
    const quantity = parseInt(qty);

    const data = await getInbound(sku, rak, quantity, type, startTime, endTime);

    if(!data.success){
        res.status(400).send({
            success: false,
            error: data.error
        });
    }
    
    res.status(200).send({
        success: true,
        result: data.result
    });
};

export const inboundAddHandler = async (req, res) => { 
    try{

        const { sku, rak, qty, type, user } = req.body;
    
        if (!sku || !rak || !qty || !type || !user) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }
    
        // Validation: qty must be positive number
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: "Qty must be a positive number greater than 0"
            });
        }
    
        // Validation: sku not empty
        if (sku.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "SKU cannot be empty"
            });
        }
    
        // Validation: sku not empty
        if (rak.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Rak cannot be empty"
            });
        }
        
        const data = {
            sku: sku, 
            rak: rak, 
            qty: qty, 
            type: type,
            user: user,
        };
    
        const result = await addInbound(data);

        if(!result.success){
            res.status(400).send(result);
        }
    
        res.send(JSON.stringify(data));
    }
    catch(error){
        console.error("Error in /inbound-add:", e);
        res.status(500).send({
            success: false,
            error: error
        });
    }
};
        
/**
 * Firestore Get Outbound data
 * POST /firebase/inbound
 * Body: { 
 *  "channel":Stirng
 *  "resi":String
 *  "sku":String
 *  "rak":String
 *  "qty":int
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const outboundHandler = async (req, res) => {
    const {sku, rak, qty, resi, channel, startTime, endTime} = req.body;
    const quantity = parseInt(qty);

    const data = await getOutbound(sku, rak, quantity, resi, channel, startTime, endTime);

    if(!data.success){
        res.status(400).send(data);
    }

    res.status(200).send(data);
};

export const outboundAddHandler = async (req, res) => {
    try {
        const { resi, sku, rak, qty, channel, user } = req.body;

        // Validation: Required fields
        if (!resi || !sku || !rak || !qty || !channel || !user) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        // Validation: resi not empty/whitespace
        if (resi.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "Resi cannot be empty or whitespace"
            });
        }

        // Validation: qty must be positive number
        if (typeof qty !== 'number' || qty <= 0) {
            return res.status(400).json({
                success: false,
                error: "Qty must be a positive number greater than 0"
            });
        }

        // Validation: sku not empty
        if (sku.trim().length === 0) {
            return res.status(400).json({
                success: false,
                error: "SKU cannot be empty"
            });
        }

        // Atomic transaction: deduct stock + create outbound
        const result = await addOutbound({
            resi:resi,
            sku:sku,
            rak:rak,
            qty:qty,
            channel:channel,
            user: user,
        });

        if(!result.success){
            res.status(400).send(result);
        }

        return res.json({
            success: true,
            message: "Outbound created and stock updated (atomic transaction)",
            data: {
                resi: resi,
                sku: sku,
                qty: qty,
            }
        });
    }
    catch(error) {
        console.error("Error in /outbound-add:", error);
                
        // Check if it's insufficient stock error
        if (error.message.includes("INSUFFICIENT_STOCK")) {
            const parts = error.message.split(":");
            return res.status(409).json({
                success: false,
                error: "Conflict: " + parts[1]
            });
        }
                
        // SKU not found
        if (error.message.includes("not found in Stock")) {
            return res.status(404).json({
                success: false,
                error: error.message
            });
        }
                
        // Other errors
        res.status(500).json({
            success: false,
            error: "Server error: " + error.message
        });
    }
};

export const returAddHandler = async (req, res) => {
    try{
        const { inv, resi, sku, rak, qty, channel, desc, user } = req.body;

        // Validation: Required fields
        if (!inv || !resi || !sku || !rak || !qty || !channel || !desc || !user){
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const result = await addRetur({
            inv: inv,
            resi: resi,
            sku: sku,
            rak: rak,
            qty: qty,
            channel: channel,
            user: user,
            desc: desc,
        });

        if(!result.success){
            res.status(400).send(result);    
        }

        res.status(200).send({
            success: true
        });
    }
    catch(error){
        console.log(error);
    }
};

/**
 * Firestore Get Logs / Audit trail / Warehouse Log
 * POST /firebase/logs
 * Body: { 
 *  "skuRak":String,
 *  "qty":int,
 *  "type":Stirng,
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const logHandler = async (req, res) => {
    try{
        let { skuRak, qty, type, user, startTime, endTime } = req.body;
        
        const result = await getLogs(skuRak, qty, type, user, startTime, endTime);

        if(!result.success){
            res.status(400).send(result);
        }
        else if(!result.result){
            res.status(204).send({
                success: true,
                result: []
            });
        }
    
        res.status(200).send(result);
    }
    catch(error){
        res.status(500).send({
            success: false,
            error: 'Internal server error'
        });
    }
};

