import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  setDoc
} from 'firebase/firestore';
import './App.css';

export default function AdminUploadPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtubeLinks: [''],
    timeCodes: [['']],
    tags: '',
    category: '',
    difficulty: 'Medium',
    duration: '',
    showAd: true,
    advertiser: '',
    isPremium: false,
    isHorizontal: false,
    scriptMode: false,
    replayAudioLink: '',
    showHtmlEnd: false,
    subtitles: Array(7).fill(''),
    shareId: '',
    segments: [
      { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '' }
    ]
  });

  const [categoriesList, setCategoriesList] = useState([]);
  const [advertisersList, setAdvertisersList] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [newAdvertiser, setNewAdvertiser] = useState('');
  const [videoList, setVideoList] = useState([]);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    const fetchOptions = async () => {
      const catSnap = await getDocs(collection(db, 'categories'));
      const advSnap = await getDocs(collection(db, 'advertisers'));
      const videoSnap = await getDocs(collection(db, 'videos'));
      setCategoriesList(catSnap.docs.map(doc => doc.data().name));
      setAdvertisersList(advSnap.docs.map(doc => doc.data().name));
      setVideoList(videoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchOptions();
  }, []);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const addNewCategory = async () => {
    if (!newCategory.trim()) return;
    await addDoc(collection(db, 'categories'), { name: newCategory });
    setCategoriesList(prev => [...prev, newCategory]);
    setForm(prev => ({ ...prev, category: newCategory }));
    setNewCategory('');
  };

  const addNewAdvertiser = async () => {
    if (!newAdvertiser.trim()) return;
    await addDoc(collection(db, 'advertisers'), { name: newAdvertiser });
    setAdvertisersList(prev => [...prev, newAdvertiser]);
    setForm(prev => ({ ...prev, advertiser: newAdvertiser }));
    setNewAdvertiser('');
  };

  const handleYoutubeLinkChange = (i, value) => {
    const newLinks = [...form.youtubeLinks];
    newLinks[i] = value;
    setForm(prev => ({ ...prev, youtubeLinks: newLinks }));
  };

  const addYoutubeLink = () => {
    setForm(prev => ({
      ...prev,
      youtubeLinks: [...prev.youtubeLinks, ''],
      timeCodes: [...prev.timeCodes, ['']]
    }));
  };

  const handleSubtitleChange = (i, value) => {
    const newSubs = [...form.subtitles];
    newSubs[i] = value;
    setForm(prev => ({ ...prev, subtitles: newSubs }));
  };

  const handleSegmentChange = (index, key, value) => {
    const newSegments = [...form.segments];
    newSegments[index][key] = value;
    setForm(prev => ({ ...prev, segments: newSegments }));
  };

  const addSegment = () => {
    setForm(prev => ({
      ...prev,
      segments: [...prev.segments, { actorLine: '', userLine: '', youtubeUrl: '', start: '', end: '' }]
    }));
  };

  const removeSegment = (index) => {
    const newSegments = form.segments.filter((_, i) => i !== index);
    setForm(prev => ({ ...prev, segments: newSegments }));
  };

  const handleSubmit = async () => {
    try {
      if (editId) {
        await setDoc(doc(db, 'videos', editId), form);
        toast.success('Video updated!');
        setEditId(null);
      } else {
        await addDoc(collection(db, 'videos'), form);
        toast.success('Uploaded successfully!');
      }
      window.location.reload();
    } catch (err) {
      toast.error('Error: ' + err.message);
    }
  };

  const handleDeleteVideo = async (id) => {
    if (window.confirm('Are you sure you want to delete this video?')) {
      await deleteDoc(doc(db, 'videos', id));
      setVideoList(prev => prev.filter(v => v.id !== id));
    }
  };

  const handleEditVideo = (video) => {
    setForm({ ...video });
    setEditId(video.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="container">
      <h1 className="title">{editId ? '✏️ Edit UAct Video' : '🎬 Upload UAct Video'}</h1>

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
        <input placeholder="New category" value={newCategory} onChange={e => setNewCategory(e.target.value)} />
        <button className="secondary-btn" onClick={addNewCategory}>+ Add Category</button>
      </div>

      <div className="form-group">
        <label>Advertiser</label>
        <select value={form.advertiser} onChange={e => handleChange('advertiser', e.target.value)}>
          <option value="">-- Select Advertiser --</option>
          {advertisersList.map((adv, i) => (
            <option key={i} value={adv}>{adv}</option>
          ))}
        </select>
        <input placeholder="New advertiser" value={newAdvertiser} onChange={e => setNewAdvertiser(e.target.value)} />
        <button className="secondary-btn" onClick={addNewAdvertiser}>+ Add Advertiser</button>
      </div>

      <div className="form-group">
        <label>Tags (comma separated)</label>
        <input value={form.tags} onChange={e => handleChange('tags', e.target.value)} />
      </div>

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

      <div className="form-group">
        <label>YouTube Links</label>
        {form.youtubeLinks.map((link, i) => (
          <input
            key={i}
            value={link}
            onChange={e => handleYoutubeLinkChange(i, e.target.value)}
            placeholder={`Link ${i + 1}`}
          />
        ))}
        <button type="button" className="secondary-btn" onClick={addYoutubeLink}>+ Add Link</button>
      </div>

      <div className="form-group">
        <label>Replay Audio Link</label>
        <input value={form.replayAudioLink} onChange={e => handleChange('replayAudioLink', e.target.value)} />
      </div>

      <div className="form-row">
        <label><input type="checkbox" checked={form.isPremium} onChange={e => handleChange('isPremium', e.target.checked)} /> Premium</label>
        <label><input type="checkbox" checked={form.isHorizontal} onChange={e => handleChange('isHorizontal', e.target.checked)} /> Horizontal</label>
        <label><input type="checkbox" checked={form.scriptMode} onChange={e => handleChange('scriptMode', e.target.checked)} /> Script Mode</label>
        <label><input type="checkbox" checked={form.showHtmlEnd} onChange={e => handleChange('showHtmlEnd', e.target.checked)} /> HTML at End</label>
      </div>

      <div className="subtitles">
        <h3>Subtitles (7 languages)</h3>
        {form.subtitles.map((sub, i) => (
          <div className="form-group" key={i}>
            <label>Subtitle {i + 1}</label>
            <textarea value={sub} onChange={e => handleSubtitleChange(i, e.target.value)} />
          </div>
        ))}
      </div>

      <div className="form-group">
        <label>Share ID / Tag</label>
        <input value={form.shareId} onChange={e => handleChange('shareId', e.target.value)} />
      </div>

      <div className="form-group">
        <h3>Segments</h3>
        {form.segments.map((segment, index) => (
          <div key={index} style={{ background: '#222', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
            <label>Actor Line</label>
            <textarea value={segment.actorLine} onChange={e => handleSegmentChange(index, 'actorLine', e.target.value)} />

            <label>User Line</label>
            <textarea value={segment.userLine} onChange={e => handleSegmentChange(index, 'userLine', e.target.value)} />

            <label>YouTube URL</label>
            <input value={segment.youtubeUrl} onChange={e => handleSegmentChange(index, 'youtubeUrl', e.target.value)} />

            <label>Start Time (ms)</label>
            <input value={segment.start} onChange={e => handleSegmentChange(index, 'start', e.target.value)} />

            <label>End Time (ms)</label>
            <input value={segment.end} onChange={e => handleSegmentChange(index, 'end', e.target.value)} />

            <button type="button" onClick={() => removeSegment(index)} className="secondary-btn">🗑 Remove Segment</button>
          </div>
        ))}
        <button type="button" className="secondary-btn" onClick={addSegment}>+ Add Segment</button>
      </div>

      <button className="primary-btn" onClick={handleSubmit}>🚀 {editId ? 'Update Video' : 'Submit Video'}</button>

      <h2 style={{ marginTop: '3rem' }}>📚 Uploaded Videos</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem', color: '#eee' }}>
        <thead>
          <tr style={{ background: '#333' }}>
            <th style={{ padding: '10px' }}>Title</th>
            <th>Category</th>
            <th>Duration</th>
            <th>Segments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {videoList.map(video => (
            <tr key={video.id} style={{ borderBottom: '1px solid #444' }}>
              <td style={{ padding: '10px' }}>{video.title}</td>
              <td>{video.category}</td>
              <td>{video.duration}</td>
              <td>{video.segments?.length || 0}</td>
              <td>
                <button className="secondary-btn" onClick={() => handleEditVideo(video)}>✏️ Edit</button>{' '}
                <button className="secondary-btn" onClick={() => handleDeleteVideo(video.id)}>🗑 Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
