// usePostCommentsSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function usePostCommentsSocket(postId, handlers = {}) {
  const socketRef = useRef(null);
  const joinedRoomRef = useRef(null);

  useEffect(() => {
    if (!postId) return;

    // Create socket only once (reuse across post changes)
    if (!socketRef.current) {
      socketRef.current = io(process.env.REACT_APP_BACKEND_URL, {
        auth: { token: localStorage.getItem('authToken') },
        transports: ['websocket'],
        autoConnect: true,
      });

      socketRef.current.on('connect', () => {
        window.socket = socketRef.current; // for API header compatibility
        console.log('✅ Comment socket connected:', socketRef.current.id);
      });
    }

    const socket = socketRef.current;

    // Helper: join the room after connect (or immediately if already connected)
    const joinRoom = () => {
      if (joinedRoomRef.current === postId) return; // avoid duplicate join
      socket.emit('join:post', `post:${String(postId)}`);
      joinedRoomRef.current = postId;
      console.log('📡 Joined post room:', postId);
    };

    if (socket.connected) joinRoom();
    else socket.on('connect', joinRoom);

    // Ignore own socket events (prevent duplicates)
    const ignoreIfOwn = (payload, fn) => {
      if (!fn) return;
      if (payload?.originSocketId === socket.id) return;
      fn(payload.data || payload);
    };

    // Register comment event listeners
    const handleNew = (p) => ignoreIfOwn(p, handlers.onNew);
    const handleUpdate = (p) => ignoreIfOwn(p, handlers.onUpdate);
    const handleDelete = (p) => ignoreIfOwn(p, handlers.onDelete);

    socket.on('comment:new', handleNew);
    socket.on('comment:updated', handleUpdate);
    socket.on('comment:deleted', handleDelete);

    return () => {
      // Leave room cleanly on post change/unmount
      socket.emit('leave:post', `post:${String(postId)}`);
      joinedRoomRef.current = null;

      socket.off('comment:new', handleNew);
      socket.off('comment:updated', handleUpdate);
      socket.off('comment:deleted', handleDelete);
      socket.off('connect', joinRoom);
    };
  }, [postId]); // only rerun when postId changes
}
