import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export default function usePostCommentsSocket(postId, handlers) {
  const socketRef = useRef(null);

  useEffect(() => {
    if (!postId) return;                        // no post selected yet
    const socket = io(process.env.REACT_APP_BACKEND_URL, {
      auth: { token: localStorage.getItem('authToken') },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.emit('join:post', `post:${String(postId)}`)

    // helper to ignore the echo of our own REST call
    const ignoreIfOwn = (payload, fn) => {
      if (payload?.originSocketId === socket.id) return;
      fn(payload.data || payload);              // data for new/updated, ids array for delete
    };

    socket.on('comment:new',    (p) => ignoreIfOwn(p, handlers.onNew));
    socket.on('comment:updated',(p) => ignoreIfOwn(p, handlers.onUpdate));
    socket.on('comment:deleted',(p) => ignoreIfOwn(p, handlers.onDelete));

    return () => {
      socket.emit('leave:post', postId);
      socket.off('comment:new');
      socket.off('comment:updated');
      socket.off('comment:deleted');
    };
  }, [postId, handlers]);
}
