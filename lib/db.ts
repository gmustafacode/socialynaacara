import { PrismaClient } from './generated/prisma'

const prismaClientSingleton = () => {
    return new PrismaClient()
}

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

console.log("Initializing Prisma Client...");
const db = globalThis.prisma ?? prismaClientSingleton()

// Helper to log available models even if lazy-loaded
const getModels = (obj: any) => {
    const props = new Set<string>();
    let curr = obj;
    while (curr && curr !== Object.prototype) {
        Object.getOwnPropertyNames(curr).forEach(p => props.add(p));
        curr = Object.getPrototypeOf(curr);
    }
    return Array.from(props).filter(p => !p.startsWith('_') && !p.startsWith('$') && p !== 'constructor');
};

console.log("DB Models Available:", getModels(db));

export default db

if (process.env.NODE_ENV !== 'production') globalThis.prisma = db
