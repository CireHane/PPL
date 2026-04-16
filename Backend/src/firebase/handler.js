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
        updateStock,
        createOutboundAtomicTransaction
    } from './logic.js'

/* {
	"sku":String,
	"rak":String,
	"qty":int,
	"type":Stirng,
	"startTime": Date,
	"endTime":Date
} */
export const inboundHandler = async (req, res) => {
    let data = await getInbound(req.body.sku, req.body.rak, req.body.qty, req.body.type, req.body.startTime, req.body.endTime);
    res.send(data);
};

export const inboundAddHandler = async (req, res) => {
    let data = {
        sku: req.body.sku, 
        rak: req.body.rak, 
        qty: req.body.qty, 
        type: req.body.type};

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
        const result = await createOutboundAtomicTransaction(resi, sku, rak, qty, channel);

        return res.json({
            success: true,
            message: "Outbound created and stock updated (atomic transaction)",
            data: {
                outboundId: result.outboundId,
                resi: resi,
                sku: sku,
                qty: qty,
                previousStock: result.previousStock,
                newStock: result.newStock
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