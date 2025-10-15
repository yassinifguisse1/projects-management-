import { db } from '@/db';
import { invitations } from '@/db/schema';

async function main() {
    const sampleInvitations = [
        {
            id: 'inv_cm2x3y4z5a6b7c8d',
            email: 'sarah.wilson@newcompany.com',
            organizationId: 'org_cm2x1y2z3a4b5c6d',
            projectId: null,
            role: 'member',
            invitedBy: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            status: 'pending',
            createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
            expiresAt: new Date('2024-01-17T09:00:00Z').toISOString(),
        },
        {
            id: 'inv_dm3y4z5a6b7c8d9e',
            email: 'alex.chen@startup.io',
            organizationId: 'org_dm3y2z3a4b5c6d7e',
            projectId: null,
            role: 'admin',
            invitedBy: 'user_02h5lyu3f9a0z4c2o8n7r6x9s5',
            status: 'pending',
            createdAt: new Date('2024-01-12T14:30:00Z').toISOString(),
            expiresAt: new Date('2024-01-19T14:30:00Z').toISOString(),
        },
        {
            id: 'inv_em4z5a6b7c8d9e0f',
            email: 'maria.rodriguez@tech.com',
            organizationId: null,
            projectId: 'proj_cm2x5y6z7a8b9c0d',
            role: 'member',
            invitedBy: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            status: 'pending',
            createdAt: new Date('2024-01-15T10:15:00Z').toISOString(),
            expiresAt: new Date('2024-01-22T10:15:00Z').toISOString(),
        },
        {
            id: 'inv_fm5a6b7c8d9e0f1g',
            email: 'david.kim@developer.com',
            organizationId: null,
            projectId: 'proj_dm3y6z7a8b9c0d1e',
            role: 'admin',
            invitedBy: 'user_02h5lyu3f9a0z4c2o8n7r6x9s5',
            status: 'pending',
            createdAt: new Date('2024-01-18T16:45:00Z').toISOString(),
            expiresAt: new Date('2024-01-25T16:45:00Z').toISOString(),
        },
        {
            id: 'inv_gm6b7c8d9e0f1g2h',
            email: 'lisa.brown@designer.co',
            organizationId: 'org_cm2x1y2z3a4b5c6d',
            projectId: null,
            role: 'member',
            invitedBy: 'user_03h6mzv4g0b1a5d3p9o8s7y0t6',
            status: 'accepted',
            createdAt: new Date('2024-01-08T11:20:00Z').toISOString(),
            expiresAt: new Date('2024-01-15T11:20:00Z').toISOString(),
        },
        {
            id: 'inv_hm7c8d9e0f1g2h3i',
            email: 'thomas.white@consultant.com',
            organizationId: null,
            projectId: 'proj_em4y7z8a9b0c1d2e',
            role: 'owner',
            invitedBy: 'user_01h4kxt2e8z9y3b1n7m6q5w8r4',
            status: 'rejected',
            createdAt: new Date('2024-01-05T08:00:00Z').toISOString(),
            expiresAt: new Date('2024-01-12T08:00:00Z').toISOString(),
        },
    ];

    await db.insert(invitations).values(sampleInvitations);
    
    console.log('✅ Invitations seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});