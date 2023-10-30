import * as net from "net";
import { sleep } from "./utils";

const CLUSTER_PORTS = [3000, 3001, 3002];
const PORT = Number(process.env.PORT) || 3005;
const LEADER_TIMEOUT_MS = 1000;

interface HeartbeatMessage {
  type: "HEARTBEAT";
}

interface AppendLogMessage {
  type: "APPEND_LOG";
  data: string;
}

type MessageTypes = "HEARTBEAT";
type Message = HeartbeatMessage | AppendLogMessage;

let heartbeatTimeoutId: NodeJS.Timeout;

const handleMessage = async (message: Message) => {
  switch (message.type) {
    case "HEARTBEAT": {
      if (heartbeatTimeoutId) {
        clearTimeout(heartbeatTimeoutId);
      }
      heartbeatTimeoutId = setTimeout(() => {
        console.log("starting leader election");
        proposeAsCandidate();
      }, LEADER_TIMEOUT_MS);
      break;
    }

    case "APPEND_LOG": {
      console.log(message.data);
      break;
    }
  }
};

// MESSAGES

const proposeAsCandidate = async () => {
  sleep(LEADER_TIMEOUT_MS);
  broadcast({ type: "APPEND_LOG", data: "HI THEREE" });
};

const voteForCandidate = () => null;
const announceElection = () => null;

const sendHeartbeat = () => broadcast({ type: "HEARTBEAT" });

const sendPrepare = () => null;
const sendPrepared = () => null;
const sendCommit = () => null;
const sendCommited = () => null;

// Abstract broadcast function to send a message to available siblings
export const broadcast = (message: Message) => {
  const ports = CLUSTER_PORTS.filter((port) => port !== PORT);

  for (const port of ports) {
    const client = new net.Socket();
    client.connect({ port: port, host: "localhost" }, () => {
      console.log(`Established connection: ${port}`);
    });

    client.write(JSON.stringify(message));

    client.on("data", (data) => {
      if (data.toString() === "ACK") {
        console.log("message accepted");
      } else {
        console.log("message declined");
      }
      client.end();
    });
    client.on("close", () => {
      console.log(`Connection closed: ${port}`);
    });
  }
};

const createRaftServer = (port, siblingPorts) => {
  const server = net.createServer((socket) => {
    console.log("Server connected");

    socket.on("data", (data) => {
      try {
        handleMessage(JSON.parse(data.toString()));
      } catch (e) {
        throw Error(`Unable to parse the message: ${e.message}`);
      }
    });

    socket.on("end", () => {
      console.log("Server disconnected\n");
    });

    socket.on("error", (err) => {
      console.error(`Error: ${err.message}\n`);
    });
  });

  server.listen(port, () => {
    console.log(`Server listening on port ${PORT}`);
  });
};
