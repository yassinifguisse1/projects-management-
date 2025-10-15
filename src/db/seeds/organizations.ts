import { db } from '@/db';
import { organizations } from '@/db/schema';

async function main() {
    const sampleOrganizations = [
        {
            id: 'org_cm2x3y4z5a6b7c8d9',
            name: 'Tech Corp',
            logoUrl: 'https://ui-avatars.com/api/?name=Tech+Corp&background=3b82f6&color=fff&size=200',
            createdBy: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'org_dm3a4b5c6d7e8f9g0',
            name: 'Creative Studio',
            logoUrl: 'https://ui-avatars.com/api/?name=Creative+Studio&background=8b5cf6&color=fff&size=200',
            createdBy: 'user_02h5lyu3f9a0z4c2o8n7r6x9s5',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'org_em4b5c6d7e8f9g0h1',
            name: 'Startup Inc',
            logoUrl: 'https://ui-avatars.com/api/?name=Startup+Inc&background=10b981&color=fff&size=200',
            createdBy: 'user_03h6mzv4g0b1a5d3p9o8s7y0t6',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(organizations).values(sampleOrganizations);
    
    console.log('✅ Organizations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});