// src/pages/SettingsPage.js
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    allowUploads: true,
    defaultSubtitleLang: 'en',
    maintenanceMode: false,
    adsEnabled: true,
    homeBannerMessage: 'Subscribe now for $1/month!',
    defaultVoiceLevel: 'medium',
    recordingEnabled: true,
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const docRef = doc(db, 'admin', 'settings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings((prev) => ({ ...prev, ...docSnap.data() }));
      }
    };
    fetchSettings();
  }, []);

  const updateSetting = async (key, value) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await setDoc(doc(db, 'admin', 'settings'), updated);
  };

  return (
    <div className="container">
      <h1 className="title">⚙️ Admin Settings</h1>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={settings.allowUploads}
            onChange={(e) => updateSetting('allowUploads', e.target.checked)}
          />{' '}
          Allow Video Uploads
        </label>
      </div>

      <div className="form-group">
        <label>Default Subtitle Language</label>
        <select
          value={settings.defaultSubtitleLang}
          onChange={(e) => updateSetting('defaultSubtitleLang', e.target.value)}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="es">Spanish</option>
          <option value="zh">Chinese</option>
          <option value="ja">Japanese</option>
          <option value="vi">Vietnamese</option>
          <option value="ar">Arabic</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={settings.maintenanceMode}
            onChange={(e) => updateSetting('maintenanceMode', e.target.checked)}
          />{' '}
          Maintenance Mode
        </label>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={settings.adsEnabled}
            onChange={(e) => updateSetting('adsEnabled', e.target.checked)}
          />{' '}
          Show Ads (for unsubscribed users)
        </label>
      </div>

      <div className="form-group">
        <label>Home Banner Message</label>
        <input
          type="text"
          value={settings.homeBannerMessage}
          onChange={(e) => updateSetting('homeBannerMessage', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Default Voice Recognition Level</label>
        <select
          value={settings.defaultVoiceLevel}
          onChange={(e) => updateSetting('defaultVoiceLevel', e.target.value)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
          <option value="creative">Creative</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={settings.recordingEnabled}
            onChange={(e) => updateSetting('recordingEnabled', e.target.checked)}
          />{' '}
          Enable Video Recording
        </label>
      </div>
    </div>
  );
}
