import json
import logging
from typing import List
from starlette.websockets import WebSocket

logger = logging.getLogger("websocket_manager")

class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("WebSocket client connected. Total connections: %d", len(self.active_connections))

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info("WebSocket client disconnected. Total connections: %d", len(self.active_connections))

    async def broadcast(self, message: dict):
        if not self.active_connections:
            return

        payload = json.dumps(message)
        dead_connections = []
        for connection in self.active_connections:
            try:
                await connection.send_text(payload)
            except Exception as e:
                logger.warning("Error sending WebSocket message: %s", str(e))
                dead_connections.append(connection)

        for dead in dead_connections:
            if dead in self.active_connections:
                self.active_connections.remove(dead)

websocket_manager = WebSocketManager()
