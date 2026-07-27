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

export interface PolicyComparison {
    policy_a_score: number;
    policy_b_score: number;
    winner: string;
    summary: string;
    key_differences: string[];
    policy_a_verdict: string;
    policy_b_verdict: string;
}

export const analyzePolicy = async (url?: string | null, text?: string): Promise<PolicyAnalysis> => {
    const payload: any = {};
    if (url) payload.url = url;
    if (text) payload.text = text;
    const response = await api.post<PolicyAnalysis>('/analyze', payload);
    return response.data;
};

export const comparePolicies = async (
    urlA?: string | null,
    textA?: string,
    urlB?: string | null,
    textB?: string
): Promise<PolicyComparison> => {
    const payload: any = {};
    if (urlA) payload.url_a = urlA;
    if (textA) payload.text_a = textA;
    if (urlB) payload.url_b = urlB;
    if (textB) payload.text_b = textB;
    const response = await api.post<PolicyComparison>('/compare', payload);
    return response.data;
};
