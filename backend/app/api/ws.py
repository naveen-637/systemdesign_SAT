import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.services.websocket_manager import websocket_manager

router = APIRouter(tags=["WebSockets"])
logger = logging.getLogger("ws_router")

@router.websocket("/ws/updates")
async def websocket_endpoint(websocket: WebSocket):
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and accept client pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        logger.warning("WebSocket exception: %s", str(e))
        websocket_manager.disconnect(websocket)
