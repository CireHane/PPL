const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Product {
    id: string;
    sku: string;
    name: string;
    totalStock: number;
    image: [];
    rak:[{
        location: string;
        quantity: number;
    }];
}

export interface ApiError {
  success: false;
  error: string;
}

export async function stock() {
    try{
        const response = await fetch(`${API_URL}/firebase/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
        });
    
        const data = await response.json();
    
        if (!response.ok) {
            throw new Error(data.error || 'Get Stock Failed');
        }
        return data;
    }
    catch(e){
        console.log(e)
    }
}