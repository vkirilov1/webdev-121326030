const lectures = require('./lectures.json');

const students = require('./students.json');

const readline = require('node:readline');

const tools = [
  {
    name: 'find_lecture',
    description: 'Return the title and topics of one course lecture by its number, 1 to 12. Use it when asked what a lecture covers.',
    inputSchema: {
      type: 'object',
      properties: { number: { type: 'integer', description: 'Lecture number, 1 to 12' } },
      required: ['number'],
    },
  },
  {
    name: 'find_student',
    description: 'Find students by name or ID. Use it when asked about a student. Return the student\'s name, ID, and email. Use it when asked about a student.',
    inputSchema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Student name' } },
      required: ['name'],
    },
  }
];

// Print one reply as one line of JSON on stdout.
function send(reply) {
  process.stdout.write(JSON.stringify(reply) + '\n');
}

function fetchLecture(number) {
    return lectures.find(lecture => lecture.number === number);
}

function textResult(id, text, isError) {
  return { jsonrpc: '2.0', id: id, result: { content: [{ type: 'text', text: text }], isError: isError } };
}

function fetchStudent(name) {
    return students.find(student => student.name.toLowerCase() === name.toLowerCase());
}

// Decide what to answer. Return the reply, or null to answer nothing.
function handle(msg) {
  if (msg.method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: msg.params.protocolVersion,
        capabilities: { tools: {} },
        serverInfo: { name: 'lectures', version: '0.1.0' },
      },
    };
  }
  else if (msg.method === 'tools/list') {
    return {
        jsonrpc: '2.0', id: msg.id, result: { tools: tools }
    };
  }
  if (msg.method === 'tools/call') {
    const name = msg.params.name;
    const args = msg.params.arguments || {};
    if (name === 'find_lecture') {
      const lecture = fetchLecture(args.number);
      if (!lecture) {
        return textResult(msg.id, 'There is no lecture ' + args.number + '. The course has lectures 1 to 12.', true);
    }
      return textResult(msg.id, 'Lecture ' + lecture.number + ': ' + lecture.title + '. Topics: ' + lecture.topics, false);
    }
    if (name === 'find_student') {
        const student = fetchStudent(args.name);
        if (student) {
            return textResult(msg.id, 'Student found: Name: ' + student.name + ', ID: ' + student.id + ', Email: ' + student.email, false);
        }
    }
    return { jsonrpc: '2.0', id: msg.id, error: { code: -32602, message: 'Unknown tool: ' + name } };
  }
  if (msg.id !== undefined) {
    return { jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Unknown method: ' + msg.method } };
  }
  else if (msg.method === 'notifications/initialized') {
    return null;
  }
  return null;
}

const lines = readline.createInterface({ input: process.stdin });

lines.on('line', (line) => {
  const reply = handle(JSON.parse(line));
  if (reply) send(reply);
});