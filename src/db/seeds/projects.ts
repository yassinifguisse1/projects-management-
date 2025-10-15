import { db } from '@/db';
import { projects } from '@/db/schema';

async function main() {
    const sampleProjects = [
        {
            id: 'proj_cm2x3y4z5a6b7c8d',
            name: 'Website Redesign',
            logoUrl: 'https://ui-avatars.com/api/?name=WR&background=3b82f6&color=fff&size=128',
            organizationId: 'org_cm2w1x2y3z4a5b6c',
            createdBy: 'user_cm2t1u2v3w4x5y6z',
            createdAt: new Date('2024-01-08').toISOString(),
        },
        {
            id: 'proj_cm2x4z5a6b7c8d9e',
            name: 'Mobile App Development',
            logoUrl: 'https://ui-avatars.com/api/?name=MA&background=8b5cf6&color=fff&size=128',
            organizationId: 'org_cm2w1x2y3z4a5b6c',
            createdBy: 'user_cm2t2v3w4x5y6z7a',
            createdAt: new Date('2024-01-12').toISOString(),
        },
        {
            id: 'proj_cm2x5a6b7c8d9e0f',
            name: 'API Integration',
            logoUrl: 'https://ui-avatars.com/api/?name=AI&background=10b981&color=fff&size=128',
            organizationId: 'org_cm2w1x2y3z4a5b6c',
            createdBy: 'user_cm2t3w4x5y6z7a8b',
            createdAt: new Date('2024-01-18').toISOString(),
        },
        {
            id: 'proj_cm2x6b7c8d9e0f1g',
            name: 'Brand Identity',
            logoUrl: 'https://ui-avatars.com/api/?name=BI&background=f59e0b&color=fff&size=128',
            organizationId: 'org_cm2w2y3z4a5b6c7d',
            createdBy: 'user_cm2t1u2v3w4x5y6z',
            createdAt: new Date('2024-01-22').toISOString(),
        },
        {
            id: 'proj_cm2x7c8d9e0f1g2h',
            name: 'Marketing Campaign',
            logoUrl: 'https://ui-avatars.com/api/?name=MC&background=ef4444&color=fff&size=128',
            organizationId: 'org_cm2w2y3z4a5b6c7d',
            createdBy: 'user_cm2t4x5y6z7a8b9c',
            createdAt: new Date('2024-01-25').toISOString(),
        },
        {
            id: 'proj_cm2x8d9e0f1g2h3i',
            name: 'Video Production',
            logoUrl: 'https://ui-avatars.com/api/?name=VP&background=ec4899&color=fff&size=128',
            organizationId: 'org_cm2w2y3z4a5b6c7d',
            createdBy: 'user_cm2t2v3w4x5y6z7a',
            createdAt: new Date('2024-02-01').toISOString(),
        },
        {
            id: 'proj_cm2x9e0f1g2h3i4j',
            name: 'Product Launch',
            logoUrl: 'https://ui-avatars.com/api/?name=PL&background=06b6d4&color=fff&size=128',
            organizationId: 'org_cm2w3z4a5b6c7d8e',
            createdBy: 'user_cm2t5y6z7a8b9c0d',
            createdAt: new Date('2024-02-05').toISOString(),
        },
        {
            id: 'proj_cm2x0f1g2h3i4j5k',
            name: 'User Research',
            logoUrl: 'https://ui-avatars.com/api/?name=UR&background=6366f1&color=fff&size=128',
            organizationId: 'org_cm2w3z4a5b6c7d8e',
            createdBy: 'user_cm2t3w4x5y6z7a8b',
            createdAt: new Date('2024-02-10').toISOString(),
        },
        {
            id: 'proj_cm2x1g2h3i4j5k6l',
            name: 'MVP Development',
            logoUrl: 'https://ui-avatars.com/api/?name=MD&background=14b8a6&color=fff&size=128',
            organizationId: 'org_cm2w3z4a5b6c7d8e',
            createdBy: 'user_cm2t4x5y6z7a8b9c',
            createdAt: new Date('2024-02-15').toISOString(),
        },
    ];

    await db.insert(projects).values(sampleProjects);
    
    console.log('✅ Projects seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});