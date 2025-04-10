export class AchievementsRegistry {
    private static services: Record<string, any> = {};

    static registerService(name: string, service: any) {
        this.services[name] = service;
    }

    static getService(name: string) {
        if (!this.services[name]) {
            throw new Error(`Achievement service ${name} not registered`);
        }
        return this.services[name];
    }
} 