import axios from 'axios';

const api = axios.create({
    baseURL: '/api', // Proxied to localhost:8000 in dev
});

export interface RiskFlag {
    category: string;
    severity: string;
    description: string;
}

export interface UserRight {
    right: string;
    details: string;
}

export interface PolicyAnalysis {
    transparency_score: number;
    summary: string;
    risk_flags: RiskFlag[];
    user_rights: UserRight[];
    verdict: string;
}

export const analyzePolicy = async (url?: string | null, text?: string): Promise<PolicyAnalysis> => {
    const payload: any = {};
    if (url) payload.url = url;
    if (text) payload.text = text;
    const response = await api.post<PolicyAnalysis>('/analyze', payload);
    return response.data;
};
