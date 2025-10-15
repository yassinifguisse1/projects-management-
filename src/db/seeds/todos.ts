import { db } from '@/db';
import { todos } from '@/db/schema';

async function main() {
    const sampleTodos = [
        // Website Redesign Project (project_cm2x1a2b3c4d5e)
        {
            id: 'todo_cm2x3y4z5a6b7c',
            text: 'Create wireframes for homepage',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5e',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-10T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-12T14:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7d',
            text: 'Design header and navigation components',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5e',
            createdBy: 'user_cm2x0a1b2c3d4f',
            createdAt: new Date('2024-01-11T10:15:00Z').toISOString(),
            updatedAt: new Date('2024-01-15T16:45:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7e',
            text: 'Implement responsive footer section',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5e',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-16T11:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-16T11:00:00Z').toISOString(),
        },

        // Mobile App Development (project_cm2x1a2b3c4d5f)
        {
            id: 'todo_cm2x3y4z5a6b7f',
            text: 'Set up React Native project structure',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5f',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-08T08:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-09T17:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7g',
            text: 'Implement user authentication flow',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5f',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-15T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-15T09:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7h',
            text: 'Design and build home screen UI',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5f',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-17T10:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-17T10:30:00Z').toISOString(),
        },

        // Marketing Campaign Q1 (project_cm2x1a2b3c4d5g)
        {
            id: 'todo_cm2x3y4z5a6b7i',
            text: 'Create social media content calendar',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5g',
            createdBy: 'user_cm2x0a1b2c3d4h',
            createdAt: new Date('2024-01-05T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-08T15:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7j',
            text: 'Design email campaign templates',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5g',
            createdBy: 'user_cm2x0a1b2c3d4h',
            createdAt: new Date('2024-01-09T11:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-12T14:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7k',
            text: 'Launch Instagram ad campaign',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5g',
            createdBy: 'user_cm2x0a1b2c3d4h',
            createdAt: new Date('2024-01-18T08:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-18T08:00:00Z').toISOString(),
        },

        // Product Launch 2024 (project_cm2x1a2b3c4d5h)
        {
            id: 'todo_cm2x3y4z5a6b7l',
            text: 'Finalize product specifications document',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5h',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-03T10:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-07T16:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7m',
            text: 'Coordinate with manufacturing team',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5h',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-14T09:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-14T09:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7n',
            text: 'Prepare launch event presentation',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5h',
            createdBy: 'user_cm2x0a1b2c3d4f',
            createdAt: new Date('2024-01-19T11:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-19T11:00:00Z').toISOString(),
        },

        // Customer Support Portal (project_cm2x1a2b3c4d5i)
        {
            id: 'todo_cm2x3y4z5a6b7o',
            text: 'Build ticket management system backend',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5i',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-06T08:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-11T17:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7p',
            text: 'Create customer dashboard interface',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5i',
            createdBy: 'user_cm2x0a1b2c3d4f',
            createdAt: new Date('2024-01-15T10:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-15T10:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7q',
            text: 'Integrate live chat functionality',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5i',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-20T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-20T09:00:00Z').toISOString(),
        },

        // Data Analytics Dashboard (project_cm2x1a2b3c4d5j)
        {
            id: 'todo_cm2x3y4z5a6b7r',
            text: 'Set up data pipeline infrastructure',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5j',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-04T08:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-10T15:45:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7s',
            text: 'Design real-time metrics visualization',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5j',
            createdBy: 'user_cm2x0a1b2c3d4f',
            createdAt: new Date('2024-01-16T11:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-16T11:30:00Z').toISOString(),
        },

        // API Integration Project (project_cm2x1a2b3c4d5k)
        {
            id: 'todo_cm2x3y4z5a6b7t',
            text: 'Document REST API endpoints',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5k',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-07T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-13T16:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7u',
            text: 'Implement OAuth2 authentication',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5k',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-17T10:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-17T10:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7v',
            text: 'Write integration test suite',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5k',
            createdBy: 'user_cm2x0a1b2c3d4e',
            createdAt: new Date('2024-01-19T14:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-19T14:00:00Z').toISOString(),
        },

        // Employee Onboarding System (project_cm2x1a2b3c4d5l)
        {
            id: 'todo_cm2x3y4z5a6b7w',
            text: 'Create onboarding checklist template',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5l',
            createdBy: 'user_cm2x0a1b2c3d4h',
            createdAt: new Date('2024-01-05T10:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-09T15:00:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7x',
            text: 'Build employee profile management',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5l',
            createdBy: 'user_cm2x0a1b2c3d4f',
            createdAt: new Date('2024-01-18T09:30:00Z').toISOString(),
            updatedAt: new Date('2024-01-18T09:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b7y',
            text: 'Design training module interface',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5l',
            createdBy: 'user_cm2x0a1b2c3d4h',
            createdAt: new Date('2024-01-20T11:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-20T11:00:00Z').toISOString(),
        },

        // Security Audit 2024 (project_cm2x1a2b3c4d5m)
        {
            id: 'todo_cm2x3y4z5a6b7z',
            text: 'Conduct penetration testing',
            completed: true,
            projectId: 'project_cm2x1a2b3c4d5m',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-02T08:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-08T17:30:00Z').toISOString(),
        },
        {
            id: 'todo_cm2x3y4z5a6b8a',
            text: 'Review and update security policies',
            completed: false,
            projectId: 'project_cm2x1a2b3c4d5m',
            createdBy: 'user_cm2x0a1b2c3d4g',
            createdAt: new Date('2024-01-16T09:00:00Z').toISOString(),
            updatedAt: new Date('2024-01-16T09:00:00Z').toISOString(),
        },
    ];

    await db.insert(todos).values(sampleTodos);
    
    console.log('✅ Todos seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});