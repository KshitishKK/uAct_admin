import React, { useEffect, useState } from 'react';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase';
import { toast, ToastContainer } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';
import '../css/ManageAdvertisersPage.css';

export default function ManageAdvertisersPage() {
  const [advertisers, setAdvertisers] = useState([]);
  const [newAdvertiser, setNewAdvertiser] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadAdvertisers();
  }, []);

  const loadAdvertisers = async () => {
    const snap = await getDocs(collection(db, 'advertisers'));
    setAdvertisers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddAdvertiser = async () => {
    if (!newAdvertiser.trim()) return;
    try {
      await addDoc(collection(db, 'advertisers'), { name: newAdvertiser.trim() });
      toast.success(`✅ Advertiser "${newAdvertiser}" added`);
      setNewAdvertiser('');
      await loadAdvertisers();
    } catch (err) {
      toast.error('❌ Failed to add advertiser');
    }
  };

  const handleDelete = (id, name) => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="custom-confirm-alert">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete <strong>{name}</strong>?</p>
          <button
            onClick={async () => {
              onClose();
              try {
                await deleteDoc(doc(db, 'advertisers', id));
                toast.success(`🗑️ "${name}" deleted`);
                await loadAdvertisers();
              } catch {
                toast.error('❌ Error deleting advertiser');
              }
            }}
          >
            Yes
          </button>
          <button className="cancel" onClick={onClose}>Cancel</button>
        </div>
      )
    });
  };

  const handleEdit = async (id) => {
    if (!editingName.trim()) return;
    try {
      await updateDoc(doc(db, 'advertisers', id), { name: editingName.trim() });
      toast.success('✅ Advertiser updated');
      setEditingId(null);
      setEditingName('');
      await loadAdvertisers();
    } catch {
      toast.error('❌ Error updating advertiser');
    }
  };

  return (
    <div className="advertiser-container">
      <h2 className="title">📢 Manage Advertisers</h2>

      <div className="add-form">
        <input
          value={newAdvertiser}
          onChange={e => setNewAdvertiser(e.target.value)}
          placeholder="Enter new advertiser name"
        />
        <button onClick={handleAddAdvertiser}>+ Add</button>
      </div>

      <table className="advertiser-table">
        <thead>
          <tr>
            <th>Name</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {advertisers.map(adv => (
            <tr key={adv.id}>
              <td>
                {editingId === adv.id ? (
                  <input
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                  />
                ) : (
                  adv.name
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {editingId === adv.id ? (
                  <>
                    <button className="save-btn" onClick={() => handleEdit(adv.id)}>💾 Save</button>
                    <button className="cancel-btn" onClick={() => setEditingId(null)}>❌ Cancel</button>
                  </>
                ) : (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingId(adv.id);
                        setEditingName(adv.name);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(adv.id, adv.name)}
                    >
                      🗑 Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ToastContainer position="top-center" />
    </div>
  );
}



















// import React, { useEffect, useState } from 'react';
// import {
//   collection,
//   getDocs,
//   deleteDoc,
//   doc,
//   updateDoc,
//   addDoc
// } from 'firebase/firestore';
// import { db } from '../firebase';

// export default function ManageAdvertisersPage() {
//   const [advertisers, setAdvertisers] = useState([]);
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editingId, setEditingId] = useState(null);
//   const [editingName, setEditingName] = useState('');

//   useEffect(() => {
//     loadAdvertisers();
//   }, []);

//   const loadAdvertisers = async () => {
//     const snap = await getDocs(collection(db, 'advertisers'));
//     setAdvertisers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
//   };

//   const handleAddAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser.trim() });
//     setNewAdvertiser('');
//     await loadAdvertisers();
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this advertiser?')) {
//       await deleteDoc(doc(db, 'advertisers', id));
//       await loadAdvertisers();
//     }
//   };

//   const handleEdit = async (id) => {
//     if (!editingName.trim()) return;
//     await updateDoc(doc(db, 'advertisers', id), { name: editingName.trim() });
//     setEditingId(null);
//     setEditingName('');
//     await loadAdvertisers();
//   };

//   return (
//     <div className="container">
//       <h1 className="title">📢 Manage Advertisers</h1>

//       <div style={{ margin: '1rem 0' }}>
//         <input
//           value={newAdvertiser}
//           onChange={e => setNewAdvertiser(e.target.value)}
//           placeholder="New advertiser name"
//         />
//         <button onClick={handleAddAdvertiser}>+ Add Advertiser</button>
//       </div>

//       <table style={{ width: '100%', color: '#eee', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ background: '#333' }}>
//             <th style={{ padding: '10px' }}>Name</th>
//             <th style={{ padding: '10px' }}>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {advertisers.map(adv => (
//             <tr key={adv.id} style={{ borderBottom: '1px solid #444' }}>
//               <td style={{ padding: '10px' }}>
//                 {editingId === adv.id ? (
//                   <input
//                     value={editingName}
//                     onChange={e => setEditingName(e.target.value)}
//                   />
//                 ) : (
//                   adv.name
//                 )}
//               </td>
//               <td style={{ padding: '10px' }}>
//                 {editingId === adv.id ? (
//                   <>
//                     <button onClick={() => handleEdit(adv.id)}>💾 Save</button>{' '}
//                     <button onClick={() => setEditingId(null)}>❌ Cancel</button>
//                   </>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => {
//                         setEditingId(adv.id);
//                         setEditingName(adv.name);
//                       }}
//                     >
//                       ✏️ Edit
//                     </button>{' '}
//                     <button onClick={() => handleDelete(adv.id)}>🗑 Delete</button>
//                   </>
//                 )}
//               </td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//     </div>
//   );
// }
