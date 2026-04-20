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
 *  rak: stirng,
 *  qty: int
 * }
 */
export const stockAdd = async (req, res) => { // Delete later, Only for testing
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
export const rakAdd = async (req, res) => { // Delete later, Only for testing
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
    const data = await getInbound(req.body.sku, req.body.rak, req.body.qty, req.body.type, req.body.startTime, req.body.endTime);
    res.send(data);
};

export const inboundAddHandler = async (req, res) => { 
    let { sku, rak, qty, type } = req.body;

    if (!sku || !rak || !qty || !type) {
        return res.status(400).json({
            success: false,
            error: "Missing required fields: resi, sku, rak, qty, channel"
        });
    }

    qty = parseInt(qty);
    
    const data = {
        sku: sku, 
        rak: rak, 
        qty: qty, 
        type: type
    };

    await addInbound(data);

    res.send(JSON.stringify(data));
};
        
export const outboundHandler = async (req, res) => {
    let data = await getOutbound(req.body.sku, req.body.rak, req.body.qty, req.body.resi, req.body.channel);

    res.send(data);
};

export const outboundAddHandler = async (req, res) => {
    try {
        const { resi, sku, rak, qty, channel } = req.body;

        // Validation: Required fields
        if (!resi || !sku || !rak || !qty || !channel) {
            return res.status(400).json({
                success: false,
                error: "Missing required fields: resi, sku, rak, qty, channel"
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
            channel:channel
        });

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
    catch(e) {
        console.error("Error in /outbound-add:", e);
                
        // Check if it's insufficient stock error
        if (e.message.includes("INSUFFICIENT_STOCK")) {
            const parts = e.message.split(":");
            return res.status(409).json({
                success: false,
                error: "Conflict: " + parts[1]
            });
        }
                
        // SKU not found
        if (e.message.includes("not found in Stock")) {
            return res.status(404).json({
                success: false,
                error: e.message
            });
        }
                
        // Other errors
        res.status(500).json({
            success: false,
            error: "Server error: " + e.message
        });
    }
};

export const returAddHandler = async (req, res) => {
    try{
        const { inv, sku, rak, qty, channel, desc } = req.body;

        // Validation: Required fields
        if (!inv || !sku || !rak || !qty || !channel || !desc){
            return res.status(400).json({
                success: false,
                error: "Missing required fields"
            });
        }

        const result = addRetur({
            inv: inv,
            sku: sku,
            rak: rak,
            qty: qty,
            channel: channel,
            desc: desc
        });

        res.status(400).send(result);
    }
    catch(error){
        console.log(error);
    }
};

/**
 * Firestore Get Logs / Audit trail / Warehouse Log
 * POST /firebase/logs
 * Body: { 
 *  "sku":String,
 *  "rak":String,
 *  "qty":int,
 *  "type":Stirng,
 *  "startTime": Date,
 *  "endTime":Date
 * }
 */
export const logHandler = async (req, res) => {
    try{
        let { sku, rak, qty, type, startTime, endTime } = req.body;
    
        if(!startTime) startTime = new Date('2000-01-01');
        if(!endTime) startTime = new Date(3600);
        
        const result = await getLogs(sku, rak, qty, type, startTime, endTime);
    
        res.status(200).send(result);
    }
    catch(error){
        console.log(error);
    }
};

