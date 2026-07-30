const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { z } = require('zod');

// Load environment variables from parent server directory
dotenv.config();

// Import MCP Tools
const { searchJobs } = require('./tools/job.tool');
const { getApplications } = require('./tools/application.tool');
const { analyzeResume } = require('./tools/resume.tool');
const { searchCandidates, rankCandidates } = require('./tools/candidate.tool');

/**
 * Initialize and start the Model Context Protocol (MCP) Server for VoiceGenie AI Agent.
 */
async function startMcpServer() {
  // Connect MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/recruiter-dashboard';
    await mongoose.connect(mongoUri);
    console.log('[MCP Server] Connected to MongoDB Atlas.');
  }

  // Dynamic import of ESM @modelcontextprotocol/sdk modules
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { StdioServerTransport } = await import('@modelcontextprotocol/sdk/server/stdio.js');

  const server = new McpServer({
    name: 'VoiceGenie-Recruitment-MCP-Server',
    version: '1.0.0'
  });

  // Tool 1: searchJobs
  server.tool(
    'searchJobs',
    'Find matching job requisitions based on skills, location, or keywords.',
    {
      skills: z.union([z.string(), z.array(z.string())]).optional().describe('Skills list or comma-separated string'),
      location: z.string().optional().describe('Location filter (e.g. Pune, Remote)'),
      keyword: z.string().optional().describe('Search keyword for title or company'),
      employmentType: z.string().optional().describe('Full-time, Contract, Remote')
    },
    async (args) => {
      const result = await searchJobs(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 2: getApplications
  server.tool(
    'getApplications',
    'Retrieve candidate application and recruitment invitation records.',
    {
      candidateId: z.string().optional().describe('Candidate Mongo ID'),
      candidateEmail: z.string().optional().describe('Candidate Email address'),
      status: z.enum(['Pending', 'Accepted', 'Rejected']).optional().describe('Invitation status'),
      recruiterId: z.string().optional().describe('Recruiter Mongo ID')
    },
    async (args) => {
      const result = await getApplications(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 3: analyzeResume
  server.tool(
    'analyzeResume',
    'Analyze resume text or candidate profile to evaluate skills, ATS score, and domain fit.',
    {
      candidateId: z.string().optional().describe('Candidate Mongo ID'),
      resumeText: z.string().optional().describe('Raw text content of resume')
    },
    async (args) => {
      const result = await analyzeResume(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 4: searchCandidates
  server.tool(
    'searchCandidates',
    'Search talent pool candidates based on skills, location, and minimum experience.',
    {
      skills: z.union([z.string(), z.array(z.string())]).optional().describe('Required skills'),
      location: z.string().optional().describe('Target candidate location'),
      keyword: z.string().optional().describe('Candidate name or role keyword'),
      minExperience: z.number().optional().describe('Minimum years of experience')
    },
    async (args) => {
      const result = await searchCandidates(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Tool 5: rankCandidates
  server.tool(
    'rankCandidates',
    'Rank candidate pool against a job requisition with skill match scores and fit justifications.',
    {
      jobId: z.string().optional().describe('Target Job Mongo ID'),
      candidateIds: z.array(z.string()).optional().describe('Array of candidate Mongo IDs')
    },
    async (args) => {
      const result = await rankCandidates(args);
      return {
        content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // Connect transport if executed as standalone MCP server
  if (process.argv.includes('--stdio') || require.main === module) {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log('[MCP Server] VoiceGenie MCP Server running on Stdio Transport.');
  }

  return server;
}

// Execute if invoked directly
if (require.main === module) {
  startMcpServer().catch(err => {
    console.error('[MCP Server] Fatal initialization error:', err);
    process.exit(1);
  });
}

module.exports = {
  startMcpServer,
  tools: {
    searchJobs,
    getApplications,
    analyzeResume,
    searchCandidates,
    rankCandidates
  }
};
