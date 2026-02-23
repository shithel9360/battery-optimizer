export interface IElectronAPI {
    getBatteryInfo: () => Promise<string>;
    getDetailedBattery: () => Promise<string>;
    getAiState: () => Promise<IAIState>;
    toggleAutoMode: (enabled: boolean) => Promise<IAIState>;
    setProfile: (profile: string) => Promise<IAIState>;
    getLoginSettings: () => Promise<boolean>;
    toggleLoginSettings: (enabled: boolean) => Promise<boolean>;
    systemOptimize: (action: string) => Promise<{ status: string; message: string }>;
    onAiUpdate: (callback: (state: IAIState) => void) => void;
}

export interface IAIState {
    isAutoEnabled: boolean;
    currentMode: string;
    targetLimit: number;
    isDischarging: boolean;
    lastReport: string;
    history: { time: string; level: number; mode: string }[];
    carbonImpact: { saved: number; efficiency: number };
    powerHogs: { name: string; impact: string; suggestion: string }[];
    activeProfile: string;
}

declare global {
    interface Window {
        electronAPI: IElectronAPI;
    }
}
