import { db } from '@/db';
import { organizationMembers } from '@/db/schema';

async function main() {
    const sampleOrganizationMembers = [
        {
            id: 'om_cm2x3y4z5a6b7c8d9',
            organizationId: 'org_cm2x1a2b3c4d5e6f7',
            userId: 'user_cm2x0a1b2c3d4e5f6',
            role: 'owner',
            joinedAt: new Date('2024-01-05').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e0',
            organizationId: 'org_cm2x1a2b3c4d5e6f7',
            userId: 'user_cm2x0a1b2c3d4e5f7',
            role: 'admin',
            joinedAt: new Date('2024-01-08').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e1',
            organizationId: 'org_cm2x1a2b3c4d5e6f7',
            userId: 'user_cm2x0a1b2c3d4e5f8',
            role: 'member',
            joinedAt: new Date('2024-01-12').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e2',
            organizationId: 'org_cm2x1a2b3c4d5e6f8',
            userId: 'user_cm2x0a1b2c3d4e5f7',
            role: 'owner',
            joinedAt: new Date('2024-01-10').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e3',
            organizationId: 'org_cm2x1a2b3c4d5e6f8',
            userId: 'user_cm2x0a1b2c3d4e5f6',
            role: 'member',
            joinedAt: new Date('2024-01-15').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e4',
            organizationId: 'org_cm2x1a2b3c4d5e6f8',
            userId: 'user_cm2x0a1b2c3d4e5f8',
            role: 'member',
            joinedAt: new Date('2024-01-18').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e5',
            organizationId: 'org_cm2x1a2b3c4d5e6f9',
            userId: 'user_cm2x0a1b2c3d4e5f8',
            role: 'owner',
            joinedAt: new Date('2024-01-14').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e6',
            organizationId: 'org_cm2x1a2b3c4d5e6f9',
            userId: 'user_cm2x0a1b2c3d4e5f6',
            role: 'admin',
            joinedAt: new Date('2024-01-20').toISOString(),
        },
        {
            id: 'om_cm2x3y4z5a6b7c8e7',
            organizationId: 'org_cm2x1a2b3c4d5e6f9',
            userId: 'user_cm2x0a1b2c3d4e5f7',
            role: 'member',
            joinedAt: new Date('2024-01-25').toISOString(),
        },
    ];

    await db.insert(organizationMembers).values(sampleOrganizationMembers);
    
    console.log('✅ Organization members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});