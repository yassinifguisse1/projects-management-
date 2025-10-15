import { db } from '@/db';
import { projectMembers } from '@/db/schema';

async function main() {
    const sampleProjectMembers = [
        {
            id: 'pm_cm2x3y4z5a6b7c8d',
            projectId: 'proj_cm2x1a2b3c4d5e6f',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'owner',
            joinedAt: new Date('2024-01-10').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7c9e',
            projectId: 'proj_cm2x1a2b3c4d5e6f',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'admin',
            joinedAt: new Date('2024-01-11').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d0f',
            projectId: 'proj_cm2x1a2b3c4d5e6f',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'member',
            joinedAt: new Date('2024-01-12').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d1g',
            projectId: 'proj_cm2x1a2b3c4d5e7g',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'owner',
            joinedAt: new Date('2024-01-13').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d2h',
            projectId: 'proj_cm2x1a2b3c4d5e7g',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'member',
            joinedAt: new Date('2024-01-14').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d3i',
            projectId: 'proj_cm2x1a2b3c4d5e8h',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'owner',
            joinedAt: new Date('2024-01-15').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d4j',
            projectId: 'proj_cm2x1a2b3c4d5e8h',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'admin',
            joinedAt: new Date('2024-01-16').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d5k',
            projectId: 'proj_cm2x1a2b3c4d5e9i',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'owner',
            joinedAt: new Date('2024-01-17').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d6l',
            projectId: 'proj_cm2x1a2b3c4d5e9i',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'member',
            joinedAt: new Date('2024-01-18').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d7m',
            projectId: 'proj_cm2x1a2b3c4d5e9i',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'admin',
            joinedAt: new Date('2024-01-19').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d8n',
            projectId: 'proj_cm2x1a2b3c4d5f0j',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'owner',
            joinedAt: new Date('2024-01-20').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7d9o',
            projectId: 'proj_cm2x1a2b3c4d5f0j',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'member',
            joinedAt: new Date('2024-01-21').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e0p',
            projectId: 'proj_cm2x1a2b3c4d5f1k',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'owner',
            joinedAt: new Date('2024-01-22').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e1q',
            projectId: 'proj_cm2x1a2b3c4d5f1k',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'admin',
            joinedAt: new Date('2024-01-23').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e2r',
            projectId: 'proj_cm2x1a2b3c4d5f2l',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'owner',
            joinedAt: new Date('2024-01-24').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e3s',
            projectId: 'proj_cm2x1a2b3c4d5f2l',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'admin',
            joinedAt: new Date('2024-01-25').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e4t',
            projectId: 'proj_cm2x1a2b3c4d5f3m',
            userId: 'user_cm2w9x8y7z6a5b5d',
            role: 'owner',
            joinedAt: new Date('2024-01-26').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e5u',
            projectId: 'proj_cm2x1a2b3c4d5f3m',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'member',
            joinedAt: new Date('2024-01-27').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e6v',
            projectId: 'proj_cm2x1a2b3c4d5f4n',
            userId: 'user_cm2w9x8y7z6a5b6e',
            role: 'owner',
            joinedAt: new Date('2024-01-28').toISOString(),
        },
        {
            id: 'pm_cm2x3y4z5a6b7e7w',
            projectId: 'proj_cm2x1a2b3c4d5f4n',
            userId: 'user_cm2w9x8y7z6a5b4c',
            role: 'member',
            joinedAt: new Date('2024-01-29').toISOString(),
        },
    ];

    await db.insert(projectMembers).values(sampleProjectMembers);
    
    console.log('✅ Project members seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});