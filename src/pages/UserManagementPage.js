import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import {
  collection,
  getDocs,
  updateDoc,
  deleteDoc,
  doc
} from 'firebase/firestore'; // 👈 Removed query and orderBy
import { toast } from 'react-toastify';
import '../css/UserManagementPage.css';
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loadingIds, setLoadingIds] = useState({}); // Tracks button loading

  useEffect(() => {
    const fetchUsers = async () => {
      // 1. Fetch users without server-side ordering
      const snapshot = await getDocs(collection(db, 'users'));
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // 2. Sort the data on the client-side
      data.sort((a, b) => {
        // Use updatedAt if available, otherwise createdAt
        const timeA = a.updatedAt || a.createdAt;
        const timeB = b.updatedAt || b.createdAt;

        // Push users without any timestamp to the end
        if (!timeB) return -1;
        if (!timeA) return 1;

        // Compare timestamps to sort most recent first
        return timeB.toMillis() - timeA.toMillis();
      });

      setUsers(data);
    };
    fetchUsers();
  }, []);

  const toggleRole = (id, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    const user = users.find(u => u.id === id);
    const nameOrEmail = user?.name || user?.email || 'this user';
    const message =
      currentRole === 'admin'
        ? `Are you sure you want to demote ${nameOrEmail} to a regular user?`
        : `Are you sure you want to promote ${nameOrEmail} to an admin?`;

    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="custom-confirm-alert">
          <h2>Confirm Role Change</h2>
          <p>{message}</p>
          <button
            onClick={async () => {
              onClose();
              setLoadingIds(prev => ({ ...prev, [id]: true }));
              try {
                // When updating the role, also update the 'updatedAt' timestamp
                await updateDoc(doc(db, 'users', id), { 
                  role: newRole,
                  updatedAt: new Date() // Set current time
                });
                
                // Manually update local state to reflect the change immediately
                setUsers(prev =>
                  prev.map(u => (u.id === id ? { ...u, role: newRole, updatedAt: { toDate: () => new Date() } } : u))
                );

                toast.success(`Role changed to ${newRole}`);
              } catch (err) {
                toast.error('Error updating role');
              } finally {
                setLoadingIds(prev => ({ ...prev, [id]: false }));
              }
            }}
          >
            Yes
          </button>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      )
    });
  };

  const deleteUser = (id) => {
    const user = users.find(u => u.id === id);
    const nameOrEmail = user?.name || user?.email || 'this user';

    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="custom-confirm-alert">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete <strong>{nameOrEmail}</strong>?</p>
          <button
            onClick={async () => {
              onClose();
              setLoadingIds(prev => ({ ...prev, [id]: true }));
              try {
                await deleteDoc(doc(db, 'users', id));
                setUsers(prev => prev.filter(u => u.id !== id));
                toast.success('User deleted');
              } catch (err) {
                toast.error('Error deleting user');
              } finally {
                setLoadingIds(prev => ({ ...prev, [id]: false }));
              }
            }}
          >
            Yes
          </button>
          <button className="cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      )
    });
  };

  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.length - adminCount;

  return (
    <div className="user-management-container">
      <h2 className="title">👥 User Management</h2>

      <p className="subtitle">
        <strong>Total:</strong> {users.length} | <strong>Admins:</strong> {adminCount} | <strong>Users:</strong> {userCount}
      </p>

      {users.length === 0 ? (
        <p className="empty">No users found.</p>
      ) : (
        <div className="table-wrapper">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Date</th> {/* 👈 Changed header from Created */}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.name || '—'}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`role-tag ${user.role}`}>{user.role}</span>
                  </td>
                  <td>
                    {/* 👇 Display updatedAt or createdAt */}
                    {(user.updatedAt || user.createdAt)?.toDate?.().toLocaleString?.() || '—'}
                  </td>
                  <td>
                    <button
                      className="action-btn"
                      onClick={() => toggleRole(user.id, user.role)}
                      disabled={loadingIds[user.id]}
                    >
                      {user.role === 'admin' ? '⬇ Demote to User' : '⬆ Promote to Admin'}
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => deleteUser(user.id)}
                      disabled={loadingIds[user.id]}
                    >
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
















// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc
// } from 'firebase/firestore';
// import { toast } from 'react-toastify';
// import '../css/UserManagementPage.css';
// import { confirmAlert } from 'react-confirm-alert';
// import 'react-confirm-alert/src/react-confirm-alert.css';

// export default function UserManagementPage() {
//   const [users, setUsers] = useState([]);
//   const [loadingIds, setLoadingIds] = useState({}); // Tracks button loading

//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, 'users'));
//       const data = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setUsers(data);
//     };
//     fetchUsers();
//   }, []);

//   const toggleRole = (id, currentRole) => {
//     const newRole = currentRole === 'admin' ? 'user' : 'admin';
//     const user = users.find(u => u.id === id);
//     const nameOrEmail = user?.name || user?.email || 'this user';
//     const message =
//       currentRole === 'admin'
//         ? `Are you sure you want to demote ${nameOrEmail} to a regular user?`
//         : `Are you sure you want to promote ${nameOrEmail} to an admin?`;

//     confirmAlert({
//       customUI: ({ onClose }) => (
//         <div className="custom-confirm-alert">
//           <h2>Confirm Role Change</h2>
//           <p>{message}</p>
//           <button
//             onClick={async () => {
//               onClose();
//               setLoadingIds(prev => ({ ...prev, [id]: true }));
//               try {
//                 await updateDoc(doc(db, 'users', id), { role: newRole });
//                 setUsers(prev =>
//                   prev.map(u => (u.id === id ? { ...u, role: newRole } : u))
//                 );
//                 toast.success(`Role changed to ${newRole}`);
//               } catch (err) {
//                 toast.error('Error updating role');
//               } finally {
//                 setLoadingIds(prev => ({ ...prev, [id]: false }));
//               }
//             }}
//           >
//             Yes
//           </button>
//           <button className="cancel" onClick={onClose}>
//             Cancel
//           </button>
//         </div>
//       )
//     });
//   };

//   const deleteUser = (id) => {
//     const user = users.find(u => u.id === id);
//     const nameOrEmail = user?.name || user?.email || 'this user';

//     confirmAlert({
//       customUI: ({ onClose }) => (
//         <div className="custom-confirm-alert">
//           <h2>Confirm Deletion</h2>
//           <p>Are you sure you want to delete <strong>{nameOrEmail}</strong>?</p>
//           <button
//             onClick={async () => {
//               onClose();
//               setLoadingIds(prev => ({ ...prev, [id]: true }));
//               try {
//                 await deleteDoc(doc(db, 'users', id));
//                 setUsers(prev => prev.filter(u => u.id !== id));
//                 toast.success('User deleted');
//               } catch (err) {
//                 toast.error('Error deleting user');
//               } finally {
//                 setLoadingIds(prev => ({ ...prev, [id]: false }));
//               }
//             }}
//           >
//             Yes
//           </button>
//           <button className="cancel" onClick={onClose}>
//             Cancel
//           </button>
//         </div>
//       )
//     });
//   };

//   const adminCount = users.filter(u => u.role === 'admin').length;
//   const userCount = users.length - adminCount;

//   return (
//     <div className="user-management-container">
//       <h2 className="title">👥 User Management</h2>

//       <p className="subtitle">
//         <strong>Total:</strong> {users.length} | <strong>Admins:</strong> {adminCount} | <strong>Users:</strong> {userCount}
//       </p>

//       {users.length === 0 ? (
//         <p className="empty">No users found.</p>
//       ) : (
//         <div className="table-wrapper">
//           <table className="user-table">
//             <thead>
//               <tr>
//                 <th>Name</th>
//                 <th>Email</th>
//                 <th>Role</th>
//                 <th>Created</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map(user => (
//                 <tr key={user.id}>
//                   <td>{user.name || '—'}</td>
//                   <td>{user.email}</td>
//                   <td>
//                     <span className={`role-tag ${user.role}`}>{user.role}</span>
//                   </td>
//                   <td>{user.createdAt?.toDate?.().toLocaleString?.() || '—'}</td>
//                   <td>
//                     <button
//                       className="action-btn"
//                       onClick={() => toggleRole(user.id, user.role)}
//                       disabled={loadingIds[user.id]}
//                     >
//                       {user.role === 'admin' ? '⬇ Demote to User' : '⬆ Promote to Admin'}
//                     </button>
//                     <button
//                       className="action-btn delete"
//                       onClick={() => deleteUser(user.id)}
//                       disabled={loadingIds[user.id]}
//                     >
//                       🗑 Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
















// import React, { useEffect, useState } from 'react';
// import { db } from '../firebase';
// import {
//   collection,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   doc
// } from 'firebase/firestore';
// import { toast } from 'react-toastify';
// import '../css/UserManagementPage.css';
// import { confirmAlert } from 'react-confirm-alert';
// import 'react-confirm-alert/src/react-confirm-alert.css';


// export default function UserManagementPage() {
//   const [users, setUsers] = useState([]);
//   const [loadingIds, setLoadingIds] = useState({}); // Tracks button loading

//   useEffect(() => {
//     const fetchUsers = async () => {
//       const snapshot = await getDocs(collection(db, 'users'));
//       const data = snapshot.docs.map(doc => ({
//         id: doc.id,
//         ...doc.data()
//       }));
//       setUsers(data);
//     };
//     fetchUsers();
//   }, []);

//   const toggleRole = (id, currentRole) => {
//     const newRole = currentRole === 'admin' ? 'user' : 'admin';
//     const message =
//       currentRole === 'admin'
//         ? 'Are you sure you want to demote this admin to a regular user?'
//         : 'Are you sure you want to promote this user to an admin?';

// confirmAlert({
//   title: 'Confirm Role Change',
//   message,
//   buttons: [
//     {
//       label: 'Yes',
//       onClick: async () => {
//         setLoadingIds(prev => ({ ...prev, [id]: true }));
//         try {
//           await updateDoc(doc(db, 'users', id), { role: newRole });
//           setUsers(prev =>
//             prev.map(u => (u.id === id ? { ...u, role: newRole } : u))
//           );
//           toast.success(`Role changed to ${newRole}`);
//         } catch (err) {
//           toast.error('Error updating role');
//         } finally {
//           setLoadingIds(prev => ({ ...prev, [id]: false }));
//         }
//       }
//     },
//     {
//       label: 'Cancel',
//       className: 'cancel'
//     }
//   ],
//   overlayClassName: 'custom-confirm-overlay',
//   customUI: ({ onClose }) => (
//     <div className="custom-confirm-alert">
//       <h1>Confirm Role Change</h1>
//       <p>{message}</p>
//       <button onClick={() => {
//         onClose();
//         setLoadingIds(prev => ({ ...prev, [id]: true }));
//         updateDoc(doc(db, 'users', id), { role: newRole }).then(() => {
//           setUsers(prev =>
//             prev.map(u => (u.id === id ? { ...u, role: newRole } : u))
//           );
//           toast.success(`Role changed to ${newRole}`);
//         }).catch(() => {
//           toast.error('Error updating role');
//         }).finally(() => {
//           setLoadingIds(prev => ({ ...prev, [id]: false }));
//         });
//       }}>
//         Yes
//       </button>
//       <button className="cancel" onClick={onClose}>Cancel</button>
//     </div>
//   )
// });

//   };



// const deleteUser = (id) => {
//   confirmAlert({
//     customUI: ({ onClose }) => (
//       <div className="custom-confirm-alert">
//         <h2>Confirm Deletion</h2>
//         <p>Are you sure you want to delete this user?</p>
//         <button
//           onClick={async () => {
//             onClose();
//             setLoadingIds(prev => ({ ...prev, [id]: true }));
//             try {
//               await deleteDoc(doc(db, 'users', id));
//               setUsers(prev => prev.filter(u => u.id !== id));
//               toast.success('User deleted');
//             } catch (err) {
//               toast.error('Error deleting user');
//             } finally {
//               setLoadingIds(prev => ({ ...prev, [id]: false }));
//             }
//           }}
//         >
//           Yes
//         </button>
//         <button className="cancel" onClick={onClose}>
//           Cancel
//         </button>
//       </div>
//     )
//   });
// };


//   const adminCount = users.filter(u => u.role === 'admin').length;
//   const userCount = users.length - adminCount;

//   return (
//     <div className="user-management-container">
//       <h2 className="title">👥 User Management</h2>

//       <p className="subtitle">
//         <strong>Total:</strong> {users.length} | <strong>Admins:</strong> {adminCount} | <strong>Users:</strong> {userCount}
//       </p>

//       {users.length === 0 ? (
//         <p className="empty">No users found.</p>
//       ) : (
//         <div className="table-wrapper">
//           <table className="user-table">
//             <thead>
//               <tr>
//                 <th>Email</th>
//                 <th>Role</th>
//                 <th>Created</th>
//                 <th>Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {users.map(user => (
//                 <tr key={user.id}>
//                   <td>{user.email}</td>
//                   <td>
//                     <span className={`role-tag ${user.role}`}>{user.role}</span>
//                   </td>
//                   <td>{user.createdAt?.toDate?.().toLocaleString?.() || '—'}</td>
//                   <td>
//                     <button
//                       className="action-btn"
//                       onClick={() => toggleRole(user.id, user.role)}
//                       disabled={loadingIds[user.id]}
//                     >
//                       {user.role === 'admin' ? '⬇ Demote to User' : '⬆ Promote to Admin'}
//                     </button>
//                     <button
//                       className="action-btn delete"
//                       onClick={() => deleteUser(user.id)}
//                       disabled={loadingIds[user.id]}
//                     >
//                       🗑 Delete
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// }
