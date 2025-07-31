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
import '../css/ManageCategoriesPage.css';
import { toast } from 'react-toastify';
import { confirmAlert } from 'react-confirm-alert';
import 'react-toastify/dist/ReactToastify.css';
import 'react-confirm-alert/src/react-confirm-alert.css';


export default function ManageCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const snap = await getDocs(collection(db, 'categories'));
    setCategories(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    await addDoc(collection(db, 'categories'), { name: newCategory.trim() });
    setNewCategory('');
    await loadCategories();
  };

  const handleDelete = (id, name = 'this category') => {
    confirmAlert({
      customUI: ({ onClose }) => (
        <div className="custom-confirm-alert">
          <h2>Confirm Deletion</h2>
          <p>Are you sure you want to delete <strong>{name}</strong> category?</p>
          <button
            onClick={async () => {
              onClose();
              try {
                await deleteDoc(doc(db, 'categories', id));
                await loadCategories();
                toast.success(`🗑️ "${name}" deleted successfully`);
              } catch (err) {
                toast.error('❌ Error deleting category');
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

  const handleEdit = async (id) => {
    if (!editingName.trim()) return;
    await updateDoc(doc(db, 'categories', id), { name: editingName.trim() });
    setEditingId(null);
    setEditingName('');
    await loadCategories();
  };

  return (
    <div className="categories-container">
      <h2 className="categories-title">📂 Manage Categories</h2>

      <div className="add-category-form">
        <input
          className="category-input"
          value={newCategory}
          onChange={e => setNewCategory(e.target.value)}
          placeholder="Enter new category name"
        />
        <button className="add-btn" onClick={handleAddCategory}>
          + Add
        </button>
      </div>

      <table className="categories-table">
        <thead>
          <tr>
            <th>Name</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id}>
              <td>
                {editingId === cat.id ? (
                  <input
                    className="edit-input"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                  />
                ) : (
                  cat.name
                )}
              </td>
              <td style={{ textAlign: 'right' }}>
                {editingId === cat.id ? (
                  <>
                    <button className="save-btn" onClick={() => handleEdit(cat.id)}>
                      💾 Save
                    </button>
                    <button className="cancel-btn" onClick={() => setEditingId(null)}>
                      ❌ Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      className="edit-btn"
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditingName(cat.name);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(cat.id, cat.name)}>
                      🗑 Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
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

// export default function ManageCategoriesPage() {
//   const [categories, setCategories] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [editingId, setEditingId] = useState(null);
//   const [editingName, setEditingName] = useState('');

//   useEffect(() => {
//     loadCategories();
//   }, []);

//   const loadCategories = async () => {
//     const snap = await getDocs(collection(db, 'categories'));
//     setCategories(
//       snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
//     );
//   };

//   const handleAddCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory.trim() });
//     setNewCategory('');
//     await loadCategories();
//   };

//   const handleDelete = async (id) => {
//     if (window.confirm('Delete this category?')) {
//       await deleteDoc(doc(db, 'categories', id));
//       await loadCategories();
//     }
//   };

//   const handleEdit = async (id) => {
//     if (!editingName.trim()) return;
//     await updateDoc(doc(db, 'categories', id), { name: editingName.trim() });
//     setEditingId(null);
//     setEditingName('');
//     await loadCategories();
//   };

//   return (
//     <div className="container">
//       <h1 className="title">📂 Manage Categories</h1>

//       <div style={{ margin: '1rem 0' }}>
//         <input
//           value={newCategory}
//           onChange={e => setNewCategory(e.target.value)}
//           placeholder="New category name"
//         />
//         <button onClick={handleAddCategory}>+ Add Category</button>
//       </div>

//       <table style={{ width: '100%', color: '#eee', borderCollapse: 'collapse' }}>
//         <thead>
//           <tr style={{ background: '#333' }}>
//             <th style={{ padding: '10px' }}>Name</th>
//             <th style={{ padding: '10px' }}>Actions</th>
//           </tr>
//         </thead>
//         <tbody>
//           {categories.map(cat => (
//             <tr key={cat.id} style={{ borderBottom: '1px solid #444' }}>
//               <td style={{ padding: '10px' }}>
//                 {editingId === cat.id ? (
//                   <input
//                     value={editingName}
//                     onChange={e => setEditingName(e.target.value)}
//                   />
//                 ) : (
//                   cat.name
//                 )}
//               </td>
//               <td style={{ padding: '10px' }}>
//                 {editingId === cat.id ? (
//                   <>
//                     <button onClick={() => handleEdit(cat.id)}>💾 Save</button>{' '}
//                     <button onClick={() => setEditingId(null)}>❌ Cancel</button>
//                   </>
//                 ) : (
//                   <>
//                     <button
//                       onClick={() => {
//                         setEditingId(cat.id);
//                         setEditingName(cat.name);
//                       }}
//                     >
//                       ✏️ Edit
//                     </button>{' '}
//                     <button onClick={() => handleDelete(cat.id)}>🗑 Delete</button>
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
