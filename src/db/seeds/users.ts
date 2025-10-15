import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'cm2x3y4z5a6b7c8d9e0f',
            name: 'John Doe',
            email: 'john.doe@example.com',
            avatarUrl: 'https://i.pravatar.cc/150?img=1',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'kn8p9q2r3s4t5u6v7w8x',
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            avatarUrl: 'https://i.pravatar.cc/150?img=2',
            createdAt: new Date().toISOString(),
        },
        {
            id: 'lm4n5o6p7q8r9s0t1u2v',
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            avatarUrl: 'https://i.pravatar.cc/150?img=3',
            createdAt: new Date().toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});