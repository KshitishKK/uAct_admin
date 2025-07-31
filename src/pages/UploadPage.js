import React, { useState, useEffect, useMemo } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

import { storage } from '../firebase';
import '../css/UploadPage.css';

export default function UploadPage() {
  const subtitleLanguages = useMemo(() => ['ar', 'zh', 'hi', 'ja', 'ko', 'es', 'vi'], []); // Reordered languages

  const languageMap = {
    en: 'English',
    hi: 'Hindi',
    es: 'Spanish',
    zh: 'Chinese',
    ja: 'Japanese',
    vi: 'Vietnamese',
    ar: 'Arabic',
    ko: 'Korean'
  };

  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeUrl: '',
    tags: 'uAct-roleplay',
    category: '',
    difficulty: 'Medium',
    duration: '',
    thumbnail: '',
    showAd: true,
    advertiser: '',
    isPremium: false,
    isAdFree: false,
    isPublicGood: false,
    isHorizontal: false,
    scriptMode: false,
    showHtmlEnd: false,
    segments: []
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [advertisersList, setAdvertisersList] = useState([]);
  const [editId, setEditId] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      const advSnap = await getDocs(collection(db, 'advertisers'));
      setCategoriesList(catSnap.docs.map(doc => doc.data().name));
      setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
    };
    fetchOptions();

    const editData = localStorage.getItem('editVideo');
    if (editData) {
      const parsed = JSON.parse(editData);
      const segments = (parsed.segments || []).map(s => ({
        ...s,
        subtitles: s.subtitles ?? Object.fromEntries(subtitleLanguages.map(l => [l, '']))
      }));
      setForm({
        ...parsed,
        tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
        duration: typeof parsed.duration === 'number'
          ? `${Math.floor(parsed.duration / 60).toString().padStart(2, '0')}:${(parsed.duration % 60).toString().padStart(2, '0')}`
          : parsed.duration,
        segments
      });
      setEditId(parsed.id || null);
      localStorage.removeItem('editVideo');
    }
  }, [subtitleLanguages]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSegmentChange = (index, key, value) => {
    const newSegments = [...form.segments];
    newSegments[index][key] = value;

    if (['actorLine', 'userLine', 'type'].includes(key)) {
      const baseLine = newSegments[index].type === 'actor'
        ? newSegments[index].actorLine
        : newSegments[index].userLine;
      newSegments[index].subtitles = Object.fromEntries(
        subtitleLanguages.map(lang => [lang, baseLine])
      );
    }

    setForm(prev => ({ ...prev, segments: newSegments }));
  };

  const addSegment = () => {
    setForm(prev => ({
      ...prev,
      segments: [
        ...prev.segments,
        {
          actorLine: '',
          userLine: '',
          start: '',
          end: '',
          replayAudioLink: '',
          type: 'actor',
          subtitles: Object.fromEntries(subtitleLanguages.map(l => [l, '']))
        }
      ]
    }));
  };

  const removeSegment = index => {
    const newSegments = form.segments.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, segments: newSegments }));
  };

  const convertDuration = mmss => {
    if (typeof mmss === 'number') return mmss;
    if (typeof mmss === 'string' && mmss.includes(':')) {
      const [min, sec] = mmss.split(':').map(v => parseInt(v));
      return min * 60 + sec;
    }
    return 0;
  };

  // const handleThumbnailUpload = async () => {
  //   if (!thumbnailFile) return null;
  //   const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);
  //   const snapshot = await uploadBytes(storageRef, thumbnailFile);
  //   return await getDownloadURL(snapshot.ref);
  // };


  const handleThumbnailUpload = async () => {
  if (!thumbnailFile) return null;  // If no file is selected, return null

  // Create a reference to the file in Firebase Storage
  const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);

  // Upload the file
  const snapshot = await uploadBytes(storageRef, thumbnailFile);

  // Get the download URL after the file is uploaded
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL; // Return the download URL to store in Firestore
};

  // const handleSubmit = async () => {
  //   try {
  //     const thumbnailUrl = await handleThumbnailUpload();
  //     const finalData = {
  //       ...form,
  //       tags: Array.isArray(form.tags)
  //         ? form.tags.map(t => t.trim()).filter(Boolean)
  //         : form.tags.split(',').map(t => t.trim()).filter(Boolean),
  //       duration: convertDuration(form.duration),
  //       thumbnail: thumbnailUrl || form.thumbnail || null,
  //       createdAt: serverTimestamp(),
  //       updatedAt: serverTimestamp()
  //     };
  //     if (editId) {
  //       await setDoc(doc(db, 'videos', editId), finalData);
  //       toast.success('Video updated!');
  //       setEditId(null);
  //     } else {
  //       await addDoc(collection(db, 'videos'), finalData);
  //       toast.success('Uploaded successfully!');
  //     }
  //     window.location.reload();
  //   } catch (err) {
  //     toast.error('Error: ' + err.message);
  //   }
  // };

  const handleSubmit = async () => {
  try {
    const thumbnailUrl = await handleThumbnailUpload(); // Upload thumbnail and get the URL
    const finalData = {
      ...form,
      tags: Array.isArray(form.tags)
        ? form.tags.map(t => t.trim()).filter(Boolean)
        : form.tags.split(',').map(t => t.trim()).filter(Boolean),
      duration: convertDuration(form.duration),
      thumbnail: thumbnailUrl || form.thumbnail || null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    // Update Firestore if editing an existing video, otherwise add a new video
    if (editId) {
      await setDoc(doc(db, 'videos', editId), finalData);
      toast.success('Video updated!');
      setEditId(null);
    } else {
      await addDoc(collection(db, 'videos'), finalData);
      toast.success('Uploaded successfully!');
    }

    // Reload the page after submission
    window.location.reload();
  } catch (err) {
    toast.error('Error: ' + err.message); // Handle any errors that occur during the upload
  }
};


 const loadSampleData = () => {
  setForm({
    title: 'Selena Gomez Interview',
    description: 'A fun 73-questions interview with Selena Gomez.',
    youtubeUrl: 'https://youtu.be/3IjwsUgMbGM',
    tags: 'Selena, Interview, Fun',
    category: 'Interview',
    difficulty: 'Medium',
    duration: '01:25',
    thumbnail: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Selena_Gomez_2019.jpg',
    showAd: true,
    advertiser: 'YouTube',
    isPremium: false,
    isAdFree: false,
    isPublicGood: false,
    isHorizontal: true,
    scriptMode: true,
    showHtmlEnd: false,
    segments: [
      {
        actorLine: 'There she is. Selena, hi~',
        userLine: 'Hi.',
        start: '00:00:00',
        end: '00:04:29',
        replayAudioLink: '',
        type: 'actor',
        subtitles: {
          en: 'There she is. Selena, hi~',
          ar: 'ها هي. سيلينا، مرحبًا~',
          zh: '她来了。Selena，你好~',
          hi: 'वह रही सेलेना, नमस्ते~',
          ja: '彼女が来た。セレーナ、こんにちは〜',
          ko: '저기 있어요. Selena, 안녕하세요~',
          es: 'Allí está ella. Selena, hola~',
          vi: 'Cô ấy kìa. Selena, chào~'
        }
      },
      {
        actorLine: 'I have intro music for the 73 questions.',
        userLine: 'Great, cue it up. Titles?',
        start: '00:04:30',
        end: '00:06:30',
        replayAudioLink: '',
        type: 'user',
        subtitles: {
          en: 'Great, cue it up. Titles?',
          ar: 'رائع، شغّله. العناوين؟',
          zh: '太好了，放吧。字幕？',
          hi: 'बहुत बढ़िया, इसे शुरू करो। टाइटल्स?',
          ja: '素晴らしい、始めて。タイトルは？',
          ko: '좋아요, 시작해요. 제목?',
          es: 'Genial, ponlo. ¿Títulos?',
          vi: 'Tuyệt, bật nó lên. Tiêu đề?'
        }
      }
    ]
  });
};


  return (
    <div className="upload-container">
      <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

      {/* Form Fields */}
      <div className="form-group">
        <label>Title</label>
        <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Description</label>
        <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
      </div>
      <div className="form-group">
        <label>Category</label>
        <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
          <option value="">-- Select Category --</option>
          {categoriesList.map((cat, i) => (
            <option key={i} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Advertiser</label>
        <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
          <option value="">-- Select Advertiser --</option>
          {advertisersList.map((adv, i) => (
            <option key={i} value={adv}>{adv}</option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
      </div>

      {/* Difficulty and Duration */}
      <div className="form-group">
        <label>Difficulty</label>
        <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
          <option>Easy</option>
          <option>Medium</option>
          <option>Hard</option>
          <option>Creative</option>
        </select>
      </div>
      <div className="form-group">
        <label>Duration (mm:ss)</label>
        <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
      </div>

      {/* Thumbnail and YouTube URL */}
      <div className="form-group">
        <label>Thumbnail (URL or upload)</label>
        <input
          type="text"
          value={form.thumbnail}
          onChange={e => handleChange('thumbnail', e.target.value)}
          placeholder="https://example.com/image.jpg"
        />
        <input
          type="file"
          accept="image/*"
          onChange={e => setThumbnailFile(e.target.files[0])}
        />
        {(form.thumbnail || thumbnailFile) && (
          <img
            src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : form.thumbnail}
            alt="Preview"
            style={{ maxWidth: '200px', marginTop: '10px' }}
          />
        )}
      </div>
      <div className="form-group">
        <label>YouTube URL</label>
        <input
          value={form.youtubeUrl}
          onChange={e => handleChange('youtubeUrl', e.target.value)}
          placeholder="YouTube URL"
        />
      </div>

      {/* Checkboxes for Various Options */}
      <div className="form-checks">
        <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
        <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
        <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
        <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
        <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
        <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
      </div>

      {/* Segments Section */}
      <div className="form-group">
        <h3>Time Codes</h3>
        {form.segments.map((segment, index) => (
          <div key={index} className="segment-card">
            <h4>Time code {index + 1}</h4>
            <select
              value={segment.type}
              onChange={e => handleSegmentChange(index, 'type', e.target.value)}
            >
              <option value="actor">Actor</option>
              <option value="user">User</option>
            </select>

            {segment.type === 'actor' && (
              <textarea
                value={segment.actorLine}
                onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)}
                placeholder="Actor Line"
              />
            )}

            {segment.type === 'user' && (
              <textarea
                value={segment.userLine}
                onChange={e => handleSegmentChange(index, 'userLine', e.target.value)}
                placeholder="User Line"
              />
            )}

            <input
              value={segment.start}
              onChange={e => handleSegmentChange(index, 'start', e.target.value)}
              placeholder="Start Time (mm:ss:ff)"
            />
            <input
              value={segment.end}
              onChange={e => handleSegmentChange(index, 'end', e.target.value)}
              placeholder="End Time (mm:ss:ff)"
            />
            <input
              value={segment.replayAudioLink}
              onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
              placeholder="Replay Audio Link"
            />
            <div className="segment-subtitles">
              <label>Subtitles</label>
              <div className="form-group">
  <label>Subtitles (Multilingual — paste 8 lines in order)</label>
  <textarea
    value={
      subtitleLanguages
        .map(lang => segment.subtitles?.[lang] || '')
        .join('\n')
    }
    onChange={e => {
      const lines = e.target.value.split('\n');
      const updatedSubtitles = {};
      subtitleLanguages.forEach((lang, idx) => {
        updatedSubtitles[lang] = lines[idx] || '';
      });

      const updated = [...form.segments];
      updated[index].subtitles = updatedSubtitles;
      setForm(prev => ({ ...prev, segments: updated }));
    }}
    placeholder={`Paste 8 lines here:\nEnglish\nArabic\nChinese\nHindi\nJapanese\nKorean\nSpanish\nVietnamese`}
    rows={8}
  />
</div>

              {/* {subtitleLanguages.map(lang => (
                <textarea
                  key={lang}
                  value={segment.subtitles?.[lang] || ''}
                  onChange={e => {
                    const updated = [...form.segments];
                    updated[index].subtitles = {
                      ...(updated[index].subtitles || {}),
                      [lang]: e.target.value
                    };
                    setForm(prev => ({ ...prev, segments: updated }));
                  }}
                  placeholder={`Subtitle (${languageMap[lang] || lang})`}
                />
              ))} */}
            </div>
            <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
          </div>
        ))}
        <button type="button" onClick={addSegment}>+ Add Time Code</button>
      </div>

      <button className="submit-btn" onClick={handleSubmit}>
        🚀 {editId ? 'Update Video' : 'Submit Video'}
      </button>
      <button type="button" onClick={loadSampleData} style={{ marginBottom: '10px' }}>
        📥 Load Sample Data
      </button>

      <ToastContainer position="top-center" />
    </div>
  );
}


























// import React, { useState, useEffect, useMemo } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc,
//   serverTimestamp
// } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase';
// import '../css/UploadPage.css';

// export default function UploadPage() {
//   const subtitleLanguages = useMemo(() => ['en', 'hi', 'es', 'zh', 'ja', 'vi', 'ar'], []);


//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     youtubeUrl: '',
//     tags: 'uAct-roleplay',
//     category: '',
//     difficulty: 'Medium',
//     duration: '',
//     thumbnail: '',
//     showAd: true,
//     advertiser: '',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: false,
//     scriptMode: false,
//     showHtmlEnd: false,
//     segments: []
//   });

//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
  
//   const [editId, setEditId] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);
// useEffect(() => {
//   const fetchOptions = async () => {
//     const catSnap = await getDocs(collection(db, 'categories'));
//     const advSnap = await getDocs(collection(db, 'advertisers'));
//     setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//     setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//   };
//   fetchOptions();

//   const editData = localStorage.getItem('editVideo');
//   if (editData) {
//     const parsed = JSON.parse(editData);
//     const segments = (parsed.segments || []).map(s => ({
//       ...s,
//       subtitles: s.subtitles ?? Object.fromEntries(subtitleLanguages.map(l => [l, '']))
//     }));
//     setForm({
//       ...parsed,
//       tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
//       duration: typeof parsed.duration === 'number'
//         ? `${Math.floor(parsed.duration / 60).toString().padStart(2, '0')}:${(parsed.duration % 60).toString().padStart(2, '0')}`
//         : parsed.duration,
//       segments
//     });
//     setEditId(parsed.id || null);
//     localStorage.removeItem('editVideo');
//   }
// }, [subtitleLanguages]); // ✅ Add dependency


//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;

//     if (['actorLine', 'userLine', 'type'].includes(key)) {
//       const baseLine = newSegments[index].type === 'actor'
//         ? newSegments[index].actorLine
//         : newSegments[index].userLine;
//       newSegments[index].subtitles = Object.fromEntries(
//         subtitleLanguages.map(lang => [lang, baseLine])
//       );
//     }

//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const addSegment = () => {
//     setForm(prev => ({
//       ...prev,
//       segments: [
//         ...prev.segments,
//         {
//           actorLine: '',
//           userLine: '',
//           start: '',
//           end: '',
//           replayAudioLink: '',
//           type: 'actor',
//           subtitles: Object.fromEntries(subtitleLanguages.map(l => [l, '']))
//         }
//       ]
//     }));
//   };

//   const removeSegment = index => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const convertDuration = mmss => {
//     if (typeof mmss === 'number') return mmss;
//     if (typeof mmss === 'string' && mmss.includes(':')) {
//       const [min, sec] = mmss.split(':').map(v => parseInt(v));
//       return min * 60 + sec;
//     }
//     return 0;
//   };

//   const handleThumbnailUpload = async () => {
//     if (!thumbnailFile) return null;
//     const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);
//     const snapshot = await uploadBytes(storageRef, thumbnailFile);
//     return await getDownloadURL(snapshot.ref);
//   };

//   const handleSubmit = async () => {
//     try {
//       const thumbnailUrl = await handleThumbnailUpload();
//       const finalData = {
//         ...form,
//         tags: Array.isArray(form.tags)
//           ? form.tags.map(t => t.trim()).filter(Boolean)
//           : form.tags.split(',').map(t => t.trim()).filter(Boolean),
//         duration: convertDuration(form.duration),
//         thumbnail: thumbnailUrl || form.thumbnail || null,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp()
//       };
//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), finalData);
//         toast.success('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), finalData);
//         toast.success('Uploaded successfully!');
//       }
//       window.location.reload();
//     } catch (err) {
//       toast.error('Error: ' + err.message);
//     }
//   };

//   const loadSampleData = () => {
//   setForm({
//     title: 'Selena Gomez Interview',
//     description: 'A fun 73-questions interview with Selena Gomez.',
//     youtubeUrl: 'https://youtu.be/3IjwsUgMbGM',
//     tags: 'Selena, Interview, Fun',
//     category: 'Interview',
//     difficulty: 'Medium',
//     duration: '01:25',
//     thumbnail: '',
//     showAd: true,
//     advertiser: 'YouTube',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: true,
//     scriptMode: true,
//     showHtmlEnd: false,
//     segments: [
//       {
//         actorLine: 'There she is. Selena, hi~',
//         userLine: 'Hi.',
//         start: '00:00:00',
//         end: '00:04:29',
//         replayAudioLink: '',
//         type: 'actor',
//         subtitles: {
//           en: 'There she is. Selena, hi~',
//           hi: 'वह रही सेलेना, नमस्ते~',
//           es: 'Allí está ella. Selena, hola~',
//           zh: '她来了。Selena，你好~',
//           ja: '彼女が来た。セレーナ、こんにちは〜',
//           vi: 'Cô ấy kìa. Selena, chào~',
//           ar: 'ها هي. سيلينا، مرحبًا~'
//         }
//       },
//       {
//         actorLine: 'I have intro music for the 73 questions.',
//         userLine: 'Great, cue it up. Titles?',
//         start: '00:04:30',
//         end: '00:06:30',
//         replayAudioLink: '',
//         type: 'user',
//         subtitles: {
//           en: 'Great, cue it up. Titles?',
//           hi: 'बहुत बढ़िया, इसे शुरू करो। टाइटल्स?',
//           es: 'Genial, ponlo. ¿Títulos?',
//           zh: '太好了，放吧。字幕？',
//           ja: '素晴らしい、始めて。タイトルは？',
//           vi: 'Tuyệt, bật nó lên. Tiêu đề?',
//           ar: 'رائع، شغّله. العناوين؟'
//         }
//       }
//     ]
//   });
// };


//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Tags (comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Thumbnail (URL or upload)</label>
//         <input
//           type="text"
//           value={form.thumbnail}
//           onChange={e => handleChange('thumbnail', e.target.value)}
//           placeholder="https://example.com/image.jpg"
//         />
//         <input
//           type="file"
//           accept="image/*"
//           onChange={e => setThumbnailFile(e.target.files[0])}
//         />
//         {(form.thumbnail || thumbnailFile) && (
//           <img
//             src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : form.thumbnail}
//             alt="Preview"
//             style={{ maxWidth: '200px', marginTop: '10px' }}
//           />
//         )}
//       </div>

//       <div className="form-group">
//         <label>YouTube URL</label>
//         <input
//           value={form.youtubeUrl}
//           onChange={e => handleChange('youtubeUrl', e.target.value)}
//           placeholder="YouTube URL"
//         />
//       </div>

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
//         <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>

//       <div className="form-group">
//         <h3>Time Codes</h3>
//         {form.segments.map((segment, index) => (
//           <div key={index} className="segment-card">
//             <h4>Time code {index + 1}</h4>
//             <select
//               value={segment.type}
//               onChange={e => handleSegmentChange(index, 'type', e.target.value)}
//             >
//               <option value="actor">Actor</option>
//               <option value="user">User</option>
//             </select>

//             {segment.type === 'actor' && (
//               <textarea
//                 value={segment.actorLine}
//                 onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)}
//                 placeholder="Actor Line"
//               />
//             )}

//             {segment.type === 'user' && (
//               <textarea
//                 value={segment.userLine}
//                 onChange={e => handleSegmentChange(index, 'userLine', e.target.value)}
//                 placeholder="User Line"
//               />
//             )}

//             <input
//               value={segment.start}
//               onChange={e => handleSegmentChange(index, 'start', e.target.value)}
//               placeholder="Start Time (mm:ss:ff)"
//             />
//             <input
//               value={segment.end}
//               onChange={e => handleSegmentChange(index, 'end', e.target.value)}
//               placeholder="End Time (mm:ss:ff)"
//             />
//             <input
//               value={segment.replayAudioLink}
//               onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
//               placeholder="Replay Audio Link"
//             />
//             <div className="segment-subtitles">
//               <label>Subtitles</label>
//               {subtitleLanguages.map(lang => (
//                 <textarea
//                   key={lang}
//                   value={segment.subtitles?.[lang] || ''}
//                   onChange={e => {
//                     const updated = [...form.segments];
//                     updated[index].subtitles = {
//                       ...(updated[index].subtitles || {}),
//                       [lang]: e.target.value
//                     };
//                     setForm(prev => ({ ...prev, segments: updated }));
//                   }}
//                   placeholder={`Subtitle (${lang})`}
//                 />
//               ))}
//             </div>
//             <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//           </div>
//         ))}
//         <button type="button" onClick={addSegment}>+ Add Time Code</button>
//       </div>

//       <button className="submit-btn" onClick={handleSubmit}>
//         🚀 {editId ? 'Update Video' : 'Submit Video'}
//       </button>
//       <button type="button" onClick={loadSampleData} style={{ marginBottom: '10px' }}>
//   📥 Load Sample Data
// </button>

//       <ToastContainer position="top-center" />
//     </div>
//   );
// }



























// // ✅ Full updated UploadPage.js with all fields

// import React, { useState, useEffect } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc,
//   serverTimestamp
// } from 'firebase/firestore';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase';
// import '../css/UploadPage.css';

// export default function UploadPage() {
//   const subtitleLanguages = ['en', 'hi', 'es', 'zh', 'ja', 'vi', 'ar'];

//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     youtubeUrl: '',
//     tags: 'uAct-roleplay',
//     category: '',
//     difficulty: 'Medium',
//     duration: '',
//     thumbnail: '',
//     showAd: true,
//     advertiser: '',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: false,
//     scriptMode: false,
//     showHtmlEnd: false,
//     segments: []
//   });

//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editId, setEditId] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       const catSnap = await getDocs(collection(db, 'categories'));
//       const advSnap = await getDocs(collection(db, 'advertisers'));
//       setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//       setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//     };
//     fetchOptions();

//     const editData = localStorage.getItem('editVideo');
//     if (editData) {
//       const parsed = JSON.parse(editData);
//       const segments = (parsed.segments || []).map(s => ({
//         ...s,
//         subtitles: s.subtitles ?? Object.fromEntries(subtitleLanguages.map(l => [l, '']))
//       }));
//       setForm({
//         ...parsed,
//         tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
//         duration: typeof parsed.duration === 'number'
//           ? `${Math.floor(parsed.duration / 60).toString().padStart(2, '0')}:${(parsed.duration % 60).toString().padStart(2, '0')}`
//           : parsed.duration,
//         segments
//       });
//       setEditId(parsed.id || null);
//       localStorage.removeItem('editVideo');
//     }
//   }, []);

//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;

//     // Auto-generate subtitle based on type
//     if (key === 'actorLine' || key === 'userLine' || key === 'type') {
//       const baseLine = newSegments[index].type === 'actor'
//         ? newSegments[index].actorLine
//         : newSegments[index].userLine;
//       newSegments[index].subtitles = Object.fromEntries(
//         subtitleLanguages.map(lang => [lang, baseLine])
//       );
//     }

//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//     const addNewCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory });
//     setCategoriesList(prev => [...prev, newCategory]);
//     setForm(prev => ({ ...prev, category: newCategory }));
//     setNewCategory('');
//   };

//   const addNewAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
//     setAdvertisersList(prev => [...prev, newAdvertiser]);
//     setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
//     setNewAdvertiser('');
//   };


//   const addSegment = () => {
//     setForm(prev => ({
//       ...prev,
//       segments: [
//         ...prev.segments,
//         {
//           actorLine: '',
//           userLine: '',
//           start: '',
//           end: '',
//           replayAudioLink: '',
//           type: 'actor',
//           subtitles: Object.fromEntries(subtitleLanguages.map(l => [l, '']))
//         }
//       ]
//     }));
//   };

//   const removeSegment = index => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const convertDuration = mmss => {
//     if (typeof mmss === 'number') return mmss;
//     if (typeof mmss === 'string' && mmss.includes(':')) {
//       const [min, sec] = mmss.split(':').map(v => parseInt(v));
//       return min * 60 + sec;
//     }
//     return 0;
//   };

//   const handleThumbnailUpload = async () => {
//     if (!thumbnailFile) return null;
//     const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);
//     const snapshot = await uploadBytes(storageRef, thumbnailFile);
//     return await getDownloadURL(snapshot.ref);
//   };

//   const handleSubmit = async () => {
//     try {
//       const thumbnailUrl = await handleThumbnailUpload();
//       const finalData = {
//         ...form,
//         tags: Array.isArray(form.tags)
//           ? form.tags.map(t => t.trim()).filter(Boolean)
//           : form.tags.split(',').map(t => t.trim()).filter(Boolean),
//         duration: convertDuration(form.duration),
//         thumbnail: thumbnailUrl || form.thumbnail || null,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp()
//       };
//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), finalData);
//         toast.success('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), finalData);
//         toast.success('Uploaded successfully!');
//       }
//       window.location.reload();
//     } catch (err) {
//       toast.error('Error: ' + err.message);
//     }
//   };

//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//         {/* <div className="inline-input">
//           <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
//           <button type="button" onClick={addNewCategory}>+ Add</button>
//         </div> */}
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//         {/* <div className="inline-input">
//           <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
//           <button type="button" onClick={addNewAdvertiser}>+ Add</button>
//         </div> */}
//       </div>

//       <div className="form-group">
//         <label>Tags (comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Thumbnail (URL or upload)</label>
//         <input
//           type="text"
//           value={form.thumbnail}
//           onChange={e => handleChange('thumbnail', e.target.value)}
//           placeholder="https://example.com/image.jpg"
//         />
//         <input
//           type="file"
//           accept="image/*"
//           onChange={e => setThumbnailFile(e.target.files[0])}
//         />
//         {(form.thumbnail || thumbnailFile) && (
//           <img
//             src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : form.thumbnail}
//             alt="Preview"
//             style={{ maxWidth: '200px', marginTop: '10px' }}
//           />
//         )}
//       </div>

//       <div className="form-group">
//         <label>YouTube URL</label>
//         <input
//           value={form.youtubeUrl}
//           onChange={e => handleChange('youtubeUrl', e.target.value)}
//           placeholder="YouTube URL"
//         />
//       </div>

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
//         <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>

//       <div className="form-group">
//         <h3>Time Codes</h3>
//         {form.segments.map((segment, index) => (
//           <div key={index} className="segment-card">
//             <h4>Time code {index + 1}</h4>
//             <select
//               value={segment.type}
//               onChange={e => handleSegmentChange(index, 'type', e.target.value)}
//             >
//               <option value="actor">Actor</option>
//               <option value="user">User</option>
//             </select>
//             <textarea
//               value={segment.actorLine}
//               onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)}
//               placeholder="Actor Line"
//             />
//             <textarea
//               value={segment.userLine}
//               onChange={e => handleSegmentChange(index, 'userLine', e.target.value)}
//               placeholder="User Line"
//             />
//             <input
//               value={segment.start}
//               onChange={e => handleSegmentChange(index, 'start', e.target.value)}
//               placeholder="Start Time (mm:ss:ff)"
//             />
//             <input
//               value={segment.end}
//               onChange={e => handleSegmentChange(index, 'end', e.target.value)}
//               placeholder="End Time (mm:ss:ff)"
//             />
//             <input
//               value={segment.replayAudioLink}
//               onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
//               placeholder="Replay Audio Link"
//             />
//             <div className="segment-subtitles">
//               <label>Subtitles</label>
//               {subtitleLanguages.map(lang => (
//                 <textarea
//                   key={lang}
//                   value={segment.subtitles?.[lang] || ''}
//                   onChange={e => {
//                     const updated = [...form.segments];
//                     updated[index].subtitles = {
//                       ...(updated[index].subtitles || {}),
//                       [lang]: e.target.value
//                     };
//                     setForm(prev => ({ ...prev, segments: updated }));
//                   }}
//                   placeholder={`Subtitle (${lang})`}
//                 />
//               ))}
//             </div>
//             <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//           </div>
//         ))}
//         <button type="button" onClick={addSegment}>+ Add Time Code</button>
//       </div>

//       <button className="submit-btn" onClick={handleSubmit}>
//         🚀 {editId ? 'Update Video' : 'Submit Video'}
//       </button>
//       <ToastContainer position="top-center" />
//     </div>
//   );
// }











// import React, { useState, useEffect } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc,
//   serverTimestamp
// } from 'firebase/firestore';
// import '../css/UploadPage.css';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase'; 


// export default function UploadPage() {
//   const subtitleLanguages = ['en', 'hi', 'es', 'zh', 'ja', 'vi', 'ar'];

// const [form, setForm] = useState({
//   title: '',
//   description: '',
//   youtubeUrl: '',
//   subtitles: { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' },
//   tags: 'uAct-roleplay',
//   category: '',
//   difficulty: 'Medium',
//   duration: '',
//   thumbnail: '',
//   showAd: true,
//   advertiser: '',
//   isPremium: false,
//   isAdFree: false,
//   isPublicGood: false,
//   isHorizontal: false,
//   scriptMode: false,
//   showHtmlEnd: false,
//   segments: [
//     {
//       actorLine: '',
//       userLine: '',
//       start: '',
//       end: '',
//       replayAudioLink: ''
//     }
//   ]
// });


//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editId, setEditId] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       const catSnap = await getDocs(collection(db, 'categories'));
//       const advSnap = await getDocs(collection(db, 'advertisers'));
//       setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//       setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//     };
//     fetchOptions();

//     const editData = localStorage.getItem('editVideo');
//     if (editData) {
//   const parsed = JSON.parse(editData);
//   const patchedLinks = (parsed.youtubeLinks || []).map(link => ({
//     ...link,
//     subtitles: link.subtitles ?? { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' },
//     replayAudioLink: link.replayAudioLink ?? ''
//   }));

// setForm({
//   ...parsed,
//   tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
//   duration: typeof parsed.duration === 'number'
//     ? `${Math.floor(parsed.duration / 60)
//         .toString()
//         .padStart(2, '0')}:${(parsed.duration % 60).toString().padStart(2, '0')}`
//     : parsed.duration,
//   youtubeLinks: patchedLinks
// });


//   setEditId(parsed.id || null);
//   localStorage.removeItem('editVideo');
// }

//   }, []);

//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const addNewCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory });
//     setCategoriesList(prev => [...prev, newCategory]);
//     setForm(prev => ({ ...prev, category: newCategory }));
//     setNewCategory('');
//   };

//   const addNewAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
//     setAdvertisersList(prev => [...prev, newAdvertiser]);
//     setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
//     setNewAdvertiser('');
//   };


 

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

// const addSegment = () => {
//   setForm(prev => ({
//     ...prev,
//     segments: [
//       ...prev.segments,
//       {
//         actorLine: '',
//         userLine: '',
//         start: '',
//         end: '',
//         replayAudioLink: '',
//         type: 'actor',
//         subtitles: { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' }
//       }
//     ]
//   }));
// };



//   const removeSegment = (index) => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

// const convertDuration = (mmss) => {
//   if (typeof mmss === 'number') {
//     return mmss; // Already in seconds
//   }

//   if (typeof mmss === 'string' && mmss.includes(':')) {
//     const [min, sec] = mmss.split(':').map(v => parseInt(v));
//     return min * 60 + sec;
//   }

//   return 0; // fallback if format is invalid
// };

//   const handleThumbnailUpload = async () => {
//     if (!thumbnailFile) return null;
//     const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);
//     const snapshot = await uploadBytes(storageRef, thumbnailFile);
//     return await getDownloadURL(snapshot.ref);
//   };


//   const handleSubmit = async () => {
//     try {
//       const thumbnailUrl = await handleThumbnailUpload();
//       const finalData = {
//   ...form,
//   tags: Array.isArray(form.tags)
//     ? form.tags.map(t => t.trim()).filter(Boolean)
//     : form.tags.split(',').map(t => t.trim()).filter(Boolean),
//   duration: convertDuration(form.duration),
//   thumbnail: thumbnailUrl || form.thumbnail || null,
//   createdAt: serverTimestamp(),
//   updatedAt: serverTimestamp()
// };

//   //     const finalData = {
//   //       ...form,
//   //       tags: Array.isArray(form.tags)
//   // ? form.tags.map(t => t.trim()).filter(Boolean)
//   // : form.tags.split(',').map(t => t.trim()).filter(Boolean),

//   //       duration: convertDuration(form.duration),
//   //        thumbnail: thumbnailUrl || form.thumbnail || null,
//   //       createdAt: serverTimestamp(),
//   //       updatedAt: serverTimestamp()
//   //     };

//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), finalData);
//         toast.success('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), finalData);
//         toast.success('Uploaded successfully!');
//       }

//       window.location.reload();
//     } catch (err) {
//       toast.success('Error: ' + err.message);
//     }
//   };



// const loadSampleData = () => {
//   setForm({
//     title: 'Selena Gomez Interview',
//     description: 'A fun 73-questions interview with Selena Gomez.',
//     youtubeUrl: 'https://youtu.be/3IjwsUgMbGM',
//     subtitles: {
//       en: 'Hello, how are you?',
//       hi: 'नमस्ते, कैसे हो?',
//       es: 'Hola, ¿cómo estás?',
//       zh: '你好，你好吗？',
//       ja: 'こんにちは、お元気ですか？',
//       vi: 'Xin chào, bạn khỏe không?',
//       ar: 'مرحبًا، كيف حالك؟'
//     },
//     tags: 'Selena, Interview, Fun',
//     category: 'Interview',
//     difficulty: 'Medium',
//     duration: '01:25',
//     showAd: true,
//     advertiser: 'YouTube',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: true,
//     scriptMode: true,
//     showHtmlEnd: false,
//     segments: [
//   {
//     actorLine: 'There she is. Selena, hi~',
//     userLine: 'Hi.',
//     start: '00:00:00',
//     end: '00:04:29',
//     replayAudioLink: '',
//     type: 'actor',
//     subtitles: {
//       en: 'There she is. Selena, hi~',
//       hi: 'वह रही सेलेना, नमस्ते~',
//       // other languages...
//     }
//   },
//   {
//     actorLine: 'I have intro music for the 73 questions.',
//     userLine: 'Great, cue it up. Titles?',
//     start: '00:04:30',
//     end: '00:06:30',
//     replayAudioLink: '',
//     type: 'user',
//     subtitles: {
//       en: 'Great, cue it up. Titles?',
//       hi: 'बहुत बढ़िया, इसे शुरू करो। टाइटल्स?',
//       // other languages...
//     }
//   }
// ]


//   });
// };



//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
//           <button type="button" onClick={addNewCategory}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
//           <button type="button" onClick={addNewAdvertiser}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Tags (comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Thumbnail (URL or upload)</label>
//         <input
//           type="text"
//           value={form.thumbnail}
//           onChange={e => handleChange('thumbnail', e.target.value)}
//           placeholder="https://example.com/image.jpg"
//         />
//         <input
//           type="file"
//           accept="image/*"
//           onChange={e => setThumbnailFile(e.target.files[0])}
//         />
//         {(form.thumbnail || thumbnailFile) && (
//           <img
//             src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : form.thumbnail}
//             alt="Preview"
//             style={{ maxWidth: '200px', marginTop: '10px' }}
//           />
//         )}
//       </div>

//       <div className="form-group">
//   <label>YouTube URL</label>
//   <input
//     value={form.youtubeUrl}
//     onChange={e => handleChange('youtubeUrl', e.target.value)}
//     placeholder="YouTube URL"
//   />
// </div>

// {/* <div className="form-group subtitles-group">
//   <label>Subtitles</label>
//   {subtitleLanguages.map(lang => (
//     <textarea
//       key={lang}
//       value={form.subtitles?.[lang] || ''}
//       onChange={e =>
//         setForm(prev => ({
//           ...prev,
//           subtitles: { ...prev.subtitles, [lang]: e.target.value }
//         }))
//       }
//       placeholder={`Subtitle (${lang})`}
//     />
//   ))}



        
//       </div> */}

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
//         <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>
// <div className="form-group">
//   <h3>Time Codes</h3>
//   {form.segments.map((segment, index) => (
//     <div key={index} className="segment-card">
//       <h4>Time code {index + 1}</h4>
//       <select
//   value={segment.type}
//   onChange={e => handleSegmentChange(index, 'type', e.target.value)}
// >
//   <option value="actor">Actor</option>
//   <option value="user">User</option>
// </select>

//       <textarea
//         value={segment.actorLine}
//         onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)}
//         placeholder="Actor Line"
//       />
//       <textarea
//         value={segment.userLine}
//         onChange={e => handleSegmentChange(index, 'userLine', e.target.value)}
//         placeholder="User Line"
//       />
//       <input
//         value={segment.start}
//         onChange={e => handleSegmentChange(index, 'start', e.target.value)}
//         placeholder="Start Time (mm:ss:ff)"
//       />
//       <input
//         value={segment.end}
//         onChange={e => handleSegmentChange(index, 'end', e.target.value)}
//         placeholder="End Time (mm:ss:ff)"
//       />
//       <input
//         value={segment.replayAudioLink}
//         onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
//         placeholder="Replay Audio Link"
//       />
//       <div className="segment-subtitles">
//   <label>Subtitles (Based on Type)</label>
//   {subtitleLanguages.map(lang => (
//     <textarea
//       key={lang}
//       value={segment.subtitles?.[lang] || ''}
//       onChange={e => {
//         const updated = [...form.segments];
//         updated[index].subtitles = {
//           ...(updated[index].subtitles || {}),
//           [lang]: e.target.value
//         };
//         setForm(prev => ({ ...prev, segments: updated }));
//       }}
//       placeholder={`Subtitle (${lang})`}
//     />
//   ))}
// </div>

//       <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//     </div>
//   ))}
//   <button type="button" onClick={addSegment}>+ Add Time Code</button>
// </div>



//       <button className="submit-btn" onClick={handleSubmit}>🚀 {editId ? 'Update Video' : 'Submit Video'}</button>
//       <button type="button" onClick={loadSampleData} style={{ marginLeft: '10px' }}>
//   🔁 Load Sample Data
// </button>

//       <ToastContainer position="top-center" />

//     </div>
//   );
// }

















// import React, { useState, useEffect } from 'react';
// import { toast, ToastContainer } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc,
//   serverTimestamp
// } from 'firebase/firestore';
// import '../css/UploadPage.css';
// import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
// import { storage } from '../firebase'; 


// export default function UploadPage() {
//   const subtitleLanguages = ['en', 'hi', 'es', 'zh', 'ja', 'vi', 'ar'];

//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     youtubeLinks: [
//       {
//         url: '',
//         type: 'actor',
//         replayAudioLink: '',
//         subtitles: { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' }
//       }
//     ],
//     tags: 'uAct-roleplay',
//     category: '',
//     difficulty: 'Medium',
//     duration: '',
//     thumbnail: '',
//     showAd: true,
//     advertiser: '',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: false,
//     scriptMode: false,
//     showHtmlEnd: false,
//    segments: [
//     { actorLine: '', userLine: '', start: '', end: '', replayAudioLink: '', type: 'actor' }
//   // { actorLine: '', userLine: '', start: '', end: '', replayAudioLink: '' }
// ]

//   });

//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editId, setEditId] = useState(null);
//   const [thumbnailFile, setThumbnailFile] = useState(null);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       const catSnap = await getDocs(collection(db, 'categories'));
//       const advSnap = await getDocs(collection(db, 'advertisers'));
//       setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//       setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//     };
//     fetchOptions();

//     const editData = localStorage.getItem('editVideo');
//     if (editData) {
//   const parsed = JSON.parse(editData);
//   const patchedLinks = (parsed.youtubeLinks || []).map(link => ({
//     ...link,
//     subtitles: link.subtitles ?? { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' },
//     replayAudioLink: link.replayAudioLink ?? ''
//   }));

// setForm({
//   ...parsed,
//   tags: Array.isArray(parsed.tags) ? parsed.tags.join(', ') : parsed.tags,
//   duration: typeof parsed.duration === 'number'
//     ? `${Math.floor(parsed.duration / 60)
//         .toString()
//         .padStart(2, '0')}:${(parsed.duration % 60).toString().padStart(2, '0')}`
//     : parsed.duration,
//   youtubeLinks: patchedLinks
// });


//   setEditId(parsed.id || null);
//   localStorage.removeItem('editVideo');
// }

//   }, []);

//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const addNewCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory });
//     setCategoriesList(prev => [...prev, newCategory]);
//     setForm(prev => ({ ...prev, category: newCategory }));
//     setNewCategory('');
//   };

//   const addNewAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
//     setAdvertisersList(prev => [...prev, newAdvertiser]);
//     setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
//     setNewAdvertiser('');
//   };

//   const handleYoutubeLinkChange = (i, key, value) => {
//     const newLinks = [...form.youtubeLinks];
//     newLinks[i][key] = value;
//     setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//   };

//   const handleYoutubeLinkSubtitleChange = (i, lang, value) => {
//     const newLinks = [...form.youtubeLinks];
//     newLinks[i].subtitles = {
//       ...newLinks[i].subtitles,
//       [lang]: value
//     };
//     setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//   };

//   const addYoutubeLink = () => {
//     setForm(prev => ({
//       ...prev,
//       youtubeLinks: [
//         ...prev.youtubeLinks,
//         {
//           url: '',
//           type: 'actor',
//           replayAudioLink: '',
//           subtitles: { en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: '' }
//         }
//       ]
//     }));
//   };

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const addSegment = () => {
//     setForm(prev => ({
//       ...prev,
//       segments: [...prev.segments, { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '', replayAudioLink: '' }]
//     }));
//   };

//   const removeSegment = (index) => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

// const convertDuration = (mmss) => {
//   if (typeof mmss === 'number') {
//     return mmss; // Already in seconds
//   }

//   if (typeof mmss === 'string' && mmss.includes(':')) {
//     const [min, sec] = mmss.split(':').map(v => parseInt(v));
//     return min * 60 + sec;
//   }

//   return 0; // fallback if format is invalid
// };

//   const handleThumbnailUpload = async () => {
//     if (!thumbnailFile) return null;
//     const storageRef = ref(storage, `thumbnails/${thumbnailFile.name}_${Date.now()}`);
//     const snapshot = await uploadBytes(storageRef, thumbnailFile);
//     return await getDownloadURL(snapshot.ref);
//   };


//   const handleSubmit = async () => {
//     try {
//       const thumbnailUrl = await handleThumbnailUpload();
//       const finalData = {
//         ...form,
//         tags: Array.isArray(form.tags)
//   ? form.tags.map(t => t.trim()).filter(Boolean)
//   : form.tags.split(',').map(t => t.trim()).filter(Boolean),

//         duration: convertDuration(form.duration),
//          thumbnail: thumbnailUrl || form.thumbnail || null,
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp()
//       };

//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), finalData);
//         toast.success('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), finalData);
//         toast.success('Uploaded successfully!');
//       }

//       window.location.reload();
//     } catch (err) {
//       toast.success('Error: ' + err.message);
//     }
//   };

//   const extractYouTubeId = (url) => {
//     if (typeof url !== 'string') return null;
//     const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
//     return match ? match[1] : null;
//   };

// const loadSampleData = () => {
//   setForm({
//     title: 'Selena Gomez Interview',
//     description: 'A fun 73-questions interview with Selena Gomez.',
//     youtubeLinks: [
//       {
//         url: 'https://youtu.be/3IjwsUgMbGM',
//         type: 'actor',
//         replayAudioLink: '',
//         subtitles: {
//           en: 'Hello, how are you?',
//           hi: 'नमस्ते, कैसे हो?',
//           es: 'Hola, ¿cómo estás?',
//           zh: '你好，你好吗？',
//           ja: 'こんにちは、お元気ですか？',
//           vi: 'Xin chào, bạn khỏe không?',
//           ar: 'مرحبًا، كيف حالك؟'
//         }
//       }
//     ],
//     tags: 'Selena, Interview, Fun',
//     category: 'Interview',
//     difficulty: 'Medium',
//     duration: '01:25', // still in mm:ss format for duration field
//     showAd: true,
//     advertiser: 'YouTube',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: true,
//     scriptMode: true,
//     showHtmlEnd: false,
//     segments: [
//   {
//     actorLine: 'There she is. Selena, hi~',
//     userLine: 'Hi.',
//     start: '00:00:00',
//     end: '00:04:29',
//     replayAudioLink: ''
//   },
//   {
//     actorLine: 'I have intro music for the 73 questions.',
//     userLine: 'Great, cue it up. Titles?',
//     start: '00:04:30',
//     end: '00:06:30',
//     replayAudioLink: ''
//   }
// ]

//   });
// };



//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
//           <button type="button" onClick={addNewCategory}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
//           <button type="button" onClick={addNewAdvertiser}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Tags (comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Thumbnail (URL or upload)</label>
//         <input
//           type="text"
//           value={form.thumbnail}
//           onChange={e => handleChange('thumbnail', e.target.value)}
//           placeholder="https://example.com/image.jpg"
//         />
//         <input
//           type="file"
//           accept="image/*"
//           onChange={e => setThumbnailFile(e.target.files[0])}
//         />
//         {(form.thumbnail || thumbnailFile) && (
//           <img
//             src={thumbnailFile ? URL.createObjectURL(thumbnailFile) : form.thumbnail}
//             alt="Preview"
//             style={{ maxWidth: '200px', marginTop: '10px' }}
//           />
//         )}
//       </div>

//       <div className="form-group">
//         <label>YouTube Links</label>
//         {form.youtubeLinks.map((linkObj, i) => {
//           const videoId = extractYouTubeId(linkObj.url);
//           const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;

//           return (
//             <div key={i} className="youtube-link-card">
//               <div className="youtube-link-header">
//                 <strong>🎥 Link {i + 1}</strong>
//                 <button onClick={() => {
//                   const newLinks = [...form.youtubeLinks];
//                   newLinks.splice(i, 1);
//                   setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//                 }}>🗑 Remove</button>
//               </div>

//               <div className="youtube-link-row">
//                 <input
//                   value={linkObj.url}
//                   onChange={e => handleYoutubeLinkChange(i, 'url', e.target.value)}
//                   placeholder="YouTube URL"
//                 />
//                 <select
//                   value={linkObj.type}
//                   onChange={e => handleYoutubeLinkChange(i, 'type', e.target.value)}
//                 >
//                   <option value="actor">Actor</option>
//                   <option value="user">User</option>
//                 </select>
//               </div>

//               {thumbnailUrl && <img src={thumbnailUrl} alt="Thumbnail" className="youtube-thumbnail" />}

//               <div className="form-group">
//                 <label>Replay Audio Link</label>
//                 <input
//                   value={linkObj.replayAudioLink}
//                   onChange={e => handleYoutubeLinkChange(i, 'replayAudioLink', e.target.value)}
//                   placeholder="Replay Audio Link"
//                 />
//               </div>

// <div className="form-group subtitles-group">
//   <label>Subtitles (per link)</label>
//   {subtitleLanguages.map(lang => (
//     <textarea
//       key={lang}
//       value={linkObj.subtitles?.[lang] || ''}
//       onChange={e => handleYoutubeLinkSubtitleChange(i, lang, e.target.value)}
//       placeholder={`Subtitle (${lang})`}
//     />
//   ))}
// </div>

//               {/* <div className="form-group subtitles-group">
//                 <label>Subtitles (per link)</label>
//                 {Object.entries(linkObj.subtitles ?? {}).map(([lang, val]) => (
//                   <textarea
//                     key={lang}
//                     value={val}
//                     onChange={e => handleYoutubeLinkSubtitleChange(i, lang, e.target.value)}
//                     placeholder={`Subtitle (${lang})`}
//                   />
//                 ))}
//               </div> */}
//             </div>
//           );
//         })}

//         <button type="button" onClick={addYoutubeLink}>+ Add Link</button>
//       </div>

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
//         <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>
// <div className="form-group">
//   <h3>Segments</h3>
//   {form.segments.map((segment, index) => (
//     <div key={index} className="segment-card">
//       <select
//         value={segment.type}
//         onChange={e => handleSegmentChange(index, 'type', e.target.value)}
//       >
//         <option value="actor">Actor</option>
//         <option value="user">User</option>
//       </select>
//       <textarea
//         value={segment.actorLine}
//         onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)}
//         placeholder="Actor Line"
//       />
//       <textarea
//         value={segment.userLine}
//         onChange={e => handleSegmentChange(index, 'userLine', e.target.value)}
//         placeholder="User Line"
//       />
//       <input
//         value={segment.start}
//         onChange={e => handleSegmentChange(index, 'start', e.target.value)}
//         placeholder="Start Time (mm:ss:ff)"
//       />
//       <input
//         value={segment.end}
//         onChange={e => handleSegmentChange(index, 'end', e.target.value)}
//         placeholder="End Time (mm:ss:ff)"
//       />
//       <input
//         value={segment.replayAudioLink}
//         onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
//         placeholder="Replay Audio Link"
//       />
//       <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//     </div>
//   ))}
//   <button type="button" onClick={addSegment}>+ Add Segment</button>
// </div>


//       <button className="submit-btn" onClick={handleSubmit}>🚀 {editId ? 'Update Video' : 'Submit Video'}</button>
//       <button type="button" onClick={loadSampleData} style={{ marginLeft: '10px' }}>
//   🔁 Load Sample Data
// </button>

//       <ToastContainer position="top-center" />

//     </div>
//   );
// }





























// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc,
//   serverTimestamp
// } from 'firebase/firestore';
// import '../css/UploadPage.css';

// export default function UploadPage() {
//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     youtubeLinks: [''],
//     // timeCodes: [['']],
//     tags: 'uAct-roleplay',
//     category: '',
//     difficulty: 'Medium',
//     duration: '',
//     showAd: true,
//     advertiser: '',
//     isPremium: false,
//     isAdFree: false,
//     isPublicGood: false,
//     isHorizontal: false,
//     scriptMode: false,
//     replayAudioLink: '',
//     showHtmlEnd: false,
//     subtitles: {
//       en: '', hi: '', es: '', zh: '', ja: '', vi: '', ar: ''
//     },
    
//     segments: [
//       { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '', replayAudioLink: '' }
//     ]
//   });

//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       const catSnap = await getDocs(collection(db, 'categories'));
//       const advSnap = await getDocs(collection(db, 'advertisers'));
//       setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//       setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//     };
//     fetchOptions();

//     // Load edit data if exists
//     const editData = localStorage.getItem('editVideo');
//     if (editData) {
//       setForm(JSON.parse(editData));
//       setEditId(JSON.parse(editData).id || null);
//       localStorage.removeItem('editVideo');
//     }
//   }, []);

//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const addNewCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory });
//     setCategoriesList(prev => [...prev, newCategory]);
//     setForm(prev => ({ ...prev, category: newCategory }));
//     setNewCategory('');
//   };

//   const addNewAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
//     setAdvertisersList(prev => [...prev, newAdvertiser]);
//     setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
//     setNewAdvertiser('');
//   };

//   const handleYoutubeLinkChange = (i, key, value) => {
//     const newLinks = [...form.youtubeLinks];

//     // Ensure the link is an object
//     if (typeof newLinks[i] !== 'object' || newLinks[i] === null) {
//       newLinks[i] = { url: '', type: 'actor' };
//     }

//     newLinks[i][key] = value;
//     setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//   };


//   const addYoutubeLink = () => {
//     setForm(prev => ({
//       ...prev,
//       youtubeLinks: [...prev.youtubeLinks, { url: '', type: 'actor' }]
//       // timeCodes: [...prev.timeCodes, ['']]
//     }));
//   };

//   const handleSubtitleChange = (lang, value) => {
//     setForm(prev => ({
//       ...prev,
//       subtitles: { ...prev.subtitles, [lang]: value }
//     }));
//   };

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const addSegment = () => {
//     setForm(prev => ({
//       ...prev,
//       segments: [...prev.segments, { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '', replayAudioLink: '' }]
//     }));
//   };

//   const removeSegment = (index) => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const convertDuration = (mmss) => {
//     const [min, sec] = mmss.split(':').map(v => parseInt(v));
//     return min * 60 + sec;
//   };

//   const handleSubmit = async () => {
//     try {
//       const finalData = {
//         ...form,
//         tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
//         duration: convertDuration(form.duration),
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp()
//       };

//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), finalData);
//         alert('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), finalData);
//         alert('Uploaded successfully!');
//       }

//       window.location.reload();
//     } catch (err) {
//       alert('Error: ' + err.message);
//     }
//   };

//   const loadSampleData = () => {
//     setForm({
//       title: 'Selena Gomez Interview',
//       description: 'A fun 73-questions interview with Selena Gomez.',
//       youtubeLinks: [
//         { url: 'https://youtu.be/3IjwsUgMbGM', type: 'actor' }
//       ],

//       tags: 'Selena, Interview, Fun',
//       category: 'Interview',
//       difficulty: 'Medium',
//       duration: '1:25',
//       showAd: true,
//       advertiser: 'YouTube',
//       isPremium: false,
//       isAdFree: false,
//       isPublicGood: false,
//       isHorizontal: true,
//       scriptMode: true,
//       replayAudioLink: '',
//       showHtmlEnd: false,
//       subtitles: {
//         en: 'Hello, how are you?',
//         ko: '안녕하세요, 어떻게 지내세요?',
//         es: 'Hola, ¿cómo estás?',
//         hi: 'नमस्ते, कैसे हो?',
//         zh: '你好，你好吗？',
//         ja: 'こんにちは、お元気ですか？',
//         vi: 'Xin chào, bạn khỏe không?',
//         ar: 'مرحبًا، كيف حالك؟'
//       },
      
//       segments: [
//         {
//           actorLine: 'There she is. Selena, hi~',
//           userLine: 'Hi.',
//           youtubeUrl: 'https://youtu.be/3IjwsUgMbGM',
//           start: '0',
//           end: '4977'
//         },
//         {
//           actorLine: 'I have intro music for the 73 questions.',
//           userLine: 'Great, cue it up. Titles?',
//           youtubeUrl: 'https://youtu.be/3IjwsUgMbGM',
//           start: '4977',
//           end: '6921'
//         }
//       ]
//     });
//   };

//   // const extractYouTubeId = (url) => {
//   //   const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
//   //   return match ? match[1] : null;
//   // };


//   const extractYouTubeId = (url) => {
//     if (typeof url !== 'string') return null;
//     const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/);
//     return match ? match[1] : null;
//   };




//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
//           <button type="button" onClick={addNewCategory}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
//           <button type="button" onClick={addNewAdvertiser}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Tags (starts with "uAct-roleplay" comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>YouTube Links</label>
//         {form.youtubeLinks.map((linkObj, i) => {
//           const videoId = extractYouTubeId(linkObj.url);
//           const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/0.jpg` : null;

//           return (
//             <div key={i} className="youtube-link-card">
//               <div className="youtube-link-header">
//                 <strong>🎥 Link {i + 1}</strong>
//                 <button onClick={() => {
//                   const newLinks = [...form.youtubeLinks];
//                   newLinks.splice(i, 1);
//                   setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//                 }}>🗑 Remove</button>
//               </div>

//               <div className="youtube-link-row">
//                 <input
//                   value={linkObj.url}
//                   onChange={e => handleYoutubeLinkChange(i, 'url', e.target.value)}
//                   placeholder="YouTube URL"
//                 />
//                 <select
//                   value={linkObj.type}
//                   onChange={e => handleYoutubeLinkChange(i, 'type', e.target.value)}
//                 >
//                   <option value="actor">Actor</option>
//                   <option value="user">User</option>
//                 </select>
//               </div>

//               {thumbnailUrl && (
//                 <img src={thumbnailUrl} alt="Thumbnail" className="youtube-thumbnail" />
//               )}

//               {/* <div className="form-group subtitles-group">
//                 <label>Subtitles</label>
//                 {Object.entries(form.subtitles).map(([lang, val]) => (
//                   <textarea
//                     key={lang}
//                     value={val}
//                     onChange={e =>
//                       setForm(prev => ({
//                         ...prev,
//                         subtitles: {
//                           ...prev.subtitles,
//                           [lang]: e.target.value
//                         }
//                       }))
//                     }
//                     placeholder={`Subtitle (${lang})`}
//                   />
//                 ))}
//               </div> */}
//             </div>
//           );
//         })}



//         <button type="button" onClick={addYoutubeLink}>+ Add Link</button>
//       </div>

//       <div className="form-group">
//         <label>Replay Audio Link</label>
//         <input value={form.replayAudioLink} onChange={e => handleChange('replayAudioLink', e.target.value)} />
//       </div>

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isAdFree} onChange={e => handleChange('isAdFree', e.target.checked)} /> Ad Free</label>
//         <label><input type="checkbox" checked={form.isPublicGood} onChange={e => handleChange('isPublicGood', e.target.checked)} /> Public Good</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>

//       <div className="form-group">
//         <label>Subtitles (Translations — shown under English roleplay subtitles) (en, hi, es, zh, ja, vi, ar)</label>
//         {Object.entries(form.subtitles).map(([lang, value]) => (
//           <textarea key={lang} value={value} onChange={e => handleSubtitleChange(lang, e.target.value)} placeholder={`Subtitle (${lang})`} />
//         ))}
//       </div>

    

//       <div className="form-group">
//         <h3>Segments</h3>
//         {form.segments.map((segment, index) => (
//           <div key={index} className="segment-card">
//             <textarea value={segment.actorLine} onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)} placeholder="Actor Line" />
//             <textarea value={segment.userLine} onChange={e => handleSegmentChange(index, 'userLine', e.target.value)} placeholder="User Line" />
//             <input value={segment.youtubeUrl} onChange={e => handleSegmentChange(index, 'youtubeUrl', e.target.value)} placeholder="YouTube URL" />
//             <input value={segment.start} onChange={e => handleSegmentChange(index, 'start', e.target.value)} placeholder="Start Time (ms)" />
//             <input value={segment.end} onChange={e => handleSegmentChange(index, 'end', e.target.value)} placeholder="End Time (ms)" />
//             <input
//               value={segment.replayAudioLink}
//               onChange={e => handleSegmentChange(index, 'replayAudioLink', e.target.value)}
//               placeholder="Replay Audio Link"
//             />
//             <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//           </div>
//         ))}
//         <button type="button" onClick={addSegment}>+ Add Segment</button>
//       </div>

//       <button className="submit-btn" onClick={handleSubmit}>🚀 {editId ? 'Update Video' : 'Submit Video'}</button>
//       <button type="button" onClick={loadSampleData}>🔁 Load Sample Data</button>

//     </div>
//   );
// }





























// import React, { useState, useEffect } from 'react';
// import { db } from '../firebase';
// import {
//   collection,
//   addDoc,
//   getDocs,
//   doc,
//   setDoc
// } from 'firebase/firestore';
// import '../css/UploadPage.css';

// export default function UploadPage() {
//   const [form, setForm] = useState({
//     title: '',
//     description: '',
//     youtubeLinks: [''],
//     timeCodes: [['']],
//     tags: '',
//     category: '',
//     difficulty: 'Medium',
//     duration: '',
//     showAd: true,
//     advertiser: '',
//     isPremium: false,
//     isHorizontal: false,
//     scriptMode: false,
//     replayAudioLink: '',
//     showHtmlEnd: false,
//     subtitles: Array(7).fill(''),
//     shareId: '',
//     segments: [
//       { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '' }
//     ]
//   });

//   const [categoriesList, setCategoriesList] = useState([]);
//   const [advertisersList, setAdvertisersList] = useState([]);
//   const [newCategory, setNewCategory] = useState('');
//   const [newAdvertiser, setNewAdvertiser] = useState('');
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     const fetchOptions = async () => {
//       const catSnap = await getDocs(collection(db, 'categories'));
//       const advSnap = await getDocs(collection(db, 'advertisers'));
//       setCategoriesList(catSnap.docs.map(doc => doc.data().name));
//       setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
//     };
//     fetchOptions();
//   }, []);

//   const handleChange = (key, value) => {
//     setForm(prev => ({ ...prev, [key]: value }));
//   };

//   const addNewCategory = async () => {
//     if (!newCategory.trim()) return;
//     await addDoc(collection(db, 'categories'), { name: newCategory });
//     setCategoriesList(prev => [...prev, newCategory]);
//     setForm(prev => ({ ...prev, category: newCategory }));
//     setNewCategory('');
//   };

//   const addNewAdvertiser = async () => {
//     if (!newAdvertiser.trim()) return;
//     await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
//     setAdvertisersList(prev => [...prev, newAdvertiser]);
//     setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
//     setNewAdvertiser('');
//   };

//   const handleYoutubeLinkChange = (i, value) => {
//     const newLinks = [...form.youtubeLinks];
//     newLinks[i] = value;
//     setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
//   };

//   const addYoutubeLink = () => {
//     setForm(prev => ({
//       ...prev,
//       youtubeLinks: [...prev.youtubeLinks, ''],
//       timeCodes: [...prev.timeCodes, ['']]
//     }));
//   };

//   const handleSubtitleChange = (i, value) => {
//     const newSubs = [...form.subtitles];
//     newSubs[i] = value;
//     setForm(prev => ({ ...prev, subtitles: newSubs }));
//   };

//   const handleSegmentChange = (index, key, value) => {
//     const newSegments = [...form.segments];
//     newSegments[index][key] = value;
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const addSegment = () => {
//     setForm(prev => ({
//       ...prev,
//       segments: [...prev.segments, { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '' }]
//     }));
//   };

//   const removeSegment = (index) => {
//     const newSegments = form.segments.filter((_, i) => i !== index);
//     setForm(prev => ({ ...prev, segments: newSegments }));
//   };

//   const handleSubmit = async () => {
//     try {
//       if (editId) {
//         await setDoc(doc(db, 'videos', editId), form);
//         alert('Video updated!');
//         setEditId(null);
//       } else {
//         await addDoc(collection(db, 'videos'), form);
//         alert('Uploaded successfully!');
//       }
//       window.location.reload();
//     } catch (err) {
//       alert('Error: ' + err.message);
//     }
//   };

//   return (
//     <div className="upload-container">
//       <h1 className="form-title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

//       <div className="form-group">
//         <label>Title</label>
//         <input value={form.title} onChange={e => handleChange('title', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Description</label>
//         <textarea value={form.description} onChange={e => handleChange('description', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Category</label>
//         <select value={form.category} onChange={e => handleChange('category', e.target.value)}>
//           <option value="">-- Select Category --</option>
//           {categoriesList.map((cat, i) => (
//             <option key={i} value={cat}>{cat}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
//           <button type="button" onClick={addNewCategory}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Advertiser</label>
//         <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
//           <option value="">-- Select Advertiser --</option>
//           {advertisersList.map((adv, i) => (
//             <option key={i} value={adv}>{adv}</option>
//           ))}
//         </select>
//         <div className="inline-input">
//           <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
//           <button type="button" onClick={addNewAdvertiser}>+ Add</button>
//         </div>
//       </div>

//       <div className="form-group">
//         <label>Tags (comma separated)</label>
//         <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>Difficulty</label>
//         <select value={form.difficulty} onChange={e => handleChange('difficulty', e.target.value)}>
//           <option>Easy</option>
//           <option>Medium</option>
//           <option>Hard</option>
//           <option>Creative</option>
//         </select>
//       </div>

//       <div className="form-group">
//         <label>Duration (mm:ss)</label>
//         <input value={form.duration} onChange={e => handleChange('duration', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <label>YouTube Links</label>
//         {form.youtubeLinks.map((link, i) => (
//           <input key={i} value={link} onChange={e => handleYoutubeLinkChange(i, e.target.value)} placeholder={`Link ${i + 1}`} />
//         ))}
//         <button type="button" onClick={addYoutubeLink}>+ Add Link</button>
//       </div>

//       <div className="form-group">
//         <label>Replay Audio Link</label>
//         <input value={form.replayAudioLink} onChange={e => handleChange('replayAudioLink', e.target.value)} />
//       </div>

//       <div className="form-checks">
//         <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
//         <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
//         <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
//         <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
//       </div>

//       <div className="form-group">
//         <label>Subtitles (7 languages)</label>
//         {form.subtitles.map((sub, i) => (
//           <textarea key={i} value={sub} onChange={e => handleSubtitleChange(i, e.target.value)} placeholder={`Subtitle ${i + 1}`} />
//         ))}
//       </div>

//       <div className="form-group">
//         <label>Share ID / Tag</label>
//         <input value={form.shareId} onChange={e => handleChange('shareId', e.target.value)} />
//       </div>

//       <div className="form-group">
//         <h3>Segments</h3>
//         {form.segments.map((segment, index) => (
//           <div key={index} className="segment-card">
//             <textarea value={segment.actorLine} onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)} placeholder="Actor Line" />
//             <textarea value={segment.userLine} onChange={e => handleSegmentChange(index, 'userLine', e.target.value)} placeholder="User Line" />
//             <input value={segment.youtubeUrl} onChange={e => handleSegmentChange(index, 'youtubeUrl', e.target.value)} placeholder="YouTube URL" />
//             <input value={segment.start} onChange={e => handleSegmentChange(index, 'start', e.target.value)} placeholder="Start Time (ms)" />
//             <input value={segment.end} onChange={e => handleSegmentChange(index, 'end', e.target.value)} placeholder="End Time (ms)" />
//             <button type="button" onClick={() => removeSegment(index)}>🗑 Remove</button>
//           </div>
//         ))}
//         <button type="button" onClick={addSegment}>+ Add Segment</button>
//       </div>

//       <button className="submit-btn" onClick={handleSubmit}>🚀 {editId ? 'Update Video' : 'Submit Video'}</button>
//     </div>
//   );
// }
