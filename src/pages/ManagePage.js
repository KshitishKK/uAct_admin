import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import '../css/ManagePage.css'; // Add a CSS file (included below)

export default function ManagePage() {
  const [videoList, setVideoList] = useState([]);
  const navigate = useNavigate();

  // Fetch videos from Firebase Firestore
  useEffect(() => {
    const fetchVideos = async () => {
      const snap = await getDocs(collection(db, 'videos'));
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // 👇 Sort videos by date (updatedAt or createdAt) on the client
      data.sort((a, b) => {
        // Use updatedAt if it exists, otherwise fall back to createdAt
        const timeA = a.updatedAt || a.createdAt;
        const timeB = b.updatedAt || b.createdAt;

        // Keep items with no date at the bottom
        if (!timeB) return -1;
        if (!timeA) return 1;

        // Sort by most recent date
        return timeB.toMillis() - timeA.toMillis();
      });

      setVideoList(data);
    };
    fetchVideos();
  }, []);

  // Handle video deletion
  const handleDeleteVideo = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteDoc(doc(db, 'videos', id));
      setVideoList(prev => prev.filter(v => v.id !== id));
    }
  };

  // Handle video edit
  const handleEditVideo = (video) => {
    localStorage.setItem('editVideo', JSON.stringify(video));
    navigate('/upload');
  };

  // Format duration in mm:ss format
  const formatDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '-';
    // Fix for potential floating point numbers
    const totalSeconds = Math.round(seconds);
    const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
    const s = (totalSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="manage-container">
      <h1 className="manage-title">📚 Manage Uploaded Videos</h1>
      <div className="table-wrapper">
        <table className="video-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Duration</th>
              <th>Segments</th>
              <th>Difficulty</th>
              <th>Premium</th>
              <th>Ad-Free</th>
              <th>Play Count</th>
              <th>Likes</th>
              <th>Date</th> {/* 👈 Added Date column */}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {videoList.map(video => (
              <tr key={video.id}>
                <td>{video.title}</td>
                <td>{video.category}</td>
                <td>{formatDuration(video.duration)}</td>
                <td>{video.segments?.length || 0}</td>
                <td>{video.difficulty}</td>
                <td>{video.isPremium ? '✅' : '—'}</td>
                <td>{video.isAdFree ? '✅' : '—'}</td>
                <td>{video.playCount ?? 0}</td>
                <td>{video.likesCount ?? 0}</td>
                {/* 👇 Display the relevant timestamp */}
                <td>
                  {(video.updatedAt || video.createdAt)?.toDate?.().toLocaleDateString() || '—'}
                </td>
                <td className="action-buttons">
                  <button onClick={() => handleEditVideo(video)} className="edit-btn">✏️</button>
                  <button onClick={() => handleDeleteVideo(video.id)} className="delete-btn">🗑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}











// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import '../css/ManagePage.css'; // Add a CSS file (included below)

// export default function ManagePage() {
//   const [videoList, setVideoList] = useState([]);
//   const navigate = useNavigate();

//   // Fetch videos from Firebase Firestore
//   useEffect(() => {
//     const fetchVideos = async () => {
//       const snap = await getDocs(collection(db, 'videos'));
//       setVideoList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     };
//     fetchVideos();
//   }, []);

//   // Handle video deletion
//   const handleDeleteVideo = async (id) => {
//     if (window.confirm('Are you sure you want to delete this video?')) {
//       await deleteDoc(doc(db, 'videos', id));
//       setVideoList(prev => prev.filter(v => v.id !== id));
//     }
//   };

//   // Handle video edit
//   const handleEditVideo = (video) => {
//     localStorage.setItem('editVideo', JSON.stringify(video));
//     navigate('/upload');
//   };

//   // Format duration in mm:ss format
//   const formatDuration = (seconds) => {
//     if (!seconds || isNaN(seconds)) return '-';
//     const m = Math.floor(seconds / 60).toString().padStart(2, '0');
//     const s = (seconds % 60).toString().padStart(2, '0');
//     return `${m}:${s}`;
//   };

//   // const subtitleLanguages = ['ar', 'zh', 'hi', 'ja', 'ko', 'es', 'vi']; // Reordered languages

//   return (
//     <div className="manage-container">
//       <h1 className="manage-title">📚 Manage Uploaded Videos</h1>
//       <div className="table-wrapper">
//         <table className="video-table">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Category</th>
//               <th>Duration</th>
//               <th>Segments</th>
//               <th>Difficulty</th>
//               <th>Premium</th>
//               <th>Ad-Free</th>
//               <th>Play Count</th>
//               <th>Likes</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {videoList.map(video => (
//               <tr key={video.id}>
//                 <td>{video.title}</td>
//                 <td>{video.category}</td>
//                 <td>{formatDuration(video.duration)}</td>
//                 <td>{video.segments?.length || 0}</td>
//                 <td>{video.difficulty}</td>
//                 <td>{video.isPremium ? '✅' : ''}</td>
//                 <td>{video.isAdFree ? '✅' : ''}</td>
//                 <td>{video.playCount ?? 0}</td>
//                 <td>{video.likesCount ?? 0}</td>
//                 <td className="action-buttons">
//                   <button onClick={() => handleEditVideo(video)} className="edit-btn">✏️</button>
//                   <button onClick={() => handleDeleteVideo(video.id)} className="delete-btn">🗑</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }






















// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore';
// import { useNavigate } from 'react-router-dom';
// import '../css/ManagePage.css'; // Add a CSS file (included below)

// export default function ManagePage() {
//   const [videoList, setVideoList] = useState([]);
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchVideos = async () => {
//       const snap = await getDocs(collection(db, 'videos'));
//       setVideoList(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//     };
//     fetchVideos();
//   }, []);

//   const handleDeleteVideo = async (id) => {
//     if (window.confirm('Are you sure you want to delete this video?')) {
//       await deleteDoc(doc(db, 'videos', id));
//       setVideoList(prev => prev.filter(v => v.id !== id));
//     }
//   };

//   const handleEditVideo = (video) => {
//     localStorage.setItem('editVideo', JSON.stringify(video));
//     navigate('/upload');
//   };

//   const formatDuration = (seconds) => {
//     if (!seconds || isNaN(seconds)) return '-';
//     const m = Math.floor(seconds / 60).toString().padStart(2, '0');
//     const s = (seconds % 60).toString().padStart(2, '0');
//     return `${m}:${s}`;
//   };

//   return (
//     <div className="manage-container">
//       <h1 className="manage-title">📚 Manage Uploaded Videos</h1>
//       <div className="table-wrapper">
//         <table className="video-table">
//           <thead>
//             <tr>
//               <th>Title</th>
//               <th>Category</th>
//               <th>Duration</th>
//               <th>Segments</th>
//               <th>Difficulty</th>
//               <th>Premium</th>
//               <th>Ad-Free</th>
//               <th>Play Count</th>
//               <th>Likes</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {videoList.map(video => (
//               <tr key={video.id}>
//                 <td>{video.title}</td>
//                 <td>{video.category}</td>
//                 <td>{formatDuration(video.duration)}</td>
//                 <td>{video.segments?.length || 0}</td>
//                 <td>{video.difficulty}</td>
//                 <td>{video.isPremium ? '✅' : ''}</td>
//                 <td>{video.isAdFree ? '✅' : ''}</td>
//                 <td>{video.playCount ?? 0}</td>
//                 <td>{video.likesCount ?? 0}</td>
//                 <td className="action-buttons">
//                   <button onClick={() => handleEditVideo(video)} className="edit-btn">✏️</button>
//                   <button onClick={() => handleDeleteVideo(video.id)} className="delete-btn">🗑</button>
//                 </td>
//               </tr>
//             ))}
//           </tbody>
//         </table>
//       </div>
//     </div>
//   );
// }
