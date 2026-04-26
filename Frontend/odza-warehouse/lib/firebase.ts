import { promises } from "dns";
import { fetchWithAuth } from "./tokenAssistant";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Product {
  id: string;
  sku: string;
  name: string;
  images: string[]; 
  totalStock: number;
  isLowStock?: boolean;
  racks: { location: string; quantity: number }[];
}

interface ProductQuery{
    start: number;
    sku?: string;
    order?: string;
}

export interface Stock{
    data: Product[],
    max: number,
};

interface Transaction {
  id: string;
  timestamp: string;
  sku: string;
  rack: string;
  qty: number;
  action: 'Inbound' | 'Outbound' | 'Return' | 'Reject' | 'Adjustment';
  operator: string;
  description: string;
  isReverted: boolean;
}


interface InboundItem {
  id: string;
  sku: string;
  rack: string;
  qty: number;
  hasImage: boolean;
}

export async function stock(start:number = 0, sku?: string, order?: string): Promise<Stock> {
    let query: ProductQuery = {
        start: start,
        sku: '',
        order: 'recent'
    };
    if(sku) query.sku = sku;
    if(order) query.order = order;
    
    
    try{
        const response = await fetchWithAuth(`${API_URL}/firebase/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(query),
        });
        
        const data = await response.json();
    
        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Get Stock Failed');
        }
        return data.result;
    }
    catch(error: any){
        const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
        throw new Error(`Gagal mengambil data dari /firebase/stock: ${errorMessage}`);
    }
}

export async function logs() {
    try{
        const response = await fetchWithAuth(`${API_URL}/firebase/logs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.error || 'Get Logs Failed');
        }
        return data.result;
    }
    catch(error){
        console.log(error)
    }
}

export async function inboundAdds(items:InboundItem[]) {
    if(items.length === 0) return;

    try{
        const response = await fetchWithAuth(`${API_URL}/firebase/inbound-adds`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                items: items,
                user: "inbound test"
            }),
        });
        
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.error || 'Get Stock Failed');
        }
        else if(!data.success){
            return data.item;
        }

        return data;
    }
    catch(error){
        throw new Error(`Something went wrong in fetching /firebase/inbound-adds: ${error}`);
    }    
}