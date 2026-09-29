/**
 * SivaTeja AI Media Studio — Frontend Client JS
 * Built with AI & Media Intelligence Engine by Siva Teja Donthukurthi
 * Supports: Merge Clips, Custom Watermark Logo, Split Video, Social Media Downloader & Dual Theme Switcher
 */

document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // Shared System Health & Progress
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');
  const progressSection = document.getElementById('progressSection');
  const progressStage = document.getElementById('progressStage');
  const progressPercent = document.getElementById('progressPercent');
  const progressBarFill = document.getElementById('progressBarFill');
  const spinnerWrapper = document.getElementById('spinnerWrapper');
  const spinnerText = document.getElementById('spinnerText');
  const alertBox = document.getElementById('alertBox');

  // Theme Toggle Elements
  const themeToggleBtn = document.getElementById('themeToggleBtn');
  const themeIcon = document.getElementById('themeIcon');
  const themeLabel = document.getElementById('themeLabel');

  // Shared Results Panel
  const emptyResult = document.getElementById('emptyResult');
  const resultBox = document.getElementById('resultBox');
  const resultTitle = document.getElementById('resultTitle');
  const resultMetrics = document.getElementById('resultMetrics');
  const resolutionBadge = document.getElementById('resolutionBadge');
  const videoPreviewWrapper = document.getElementById('videoPreviewWrapper');
  const videoPreview = document.getElementById('videoPreview');
  const audioPreview = document.getElementById('audioPreview');
  const downloadsContainer = document.getElementById('downloadsContainer');

  // TAB 1: MERGE CLIPS
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const browseBtn = document.getElementById('browseBtn');
  const fileListContainer = document.getElementById('fileListContainer');
  const fileList = document.getElementById('fileList');
  const fileCount = document.getElementById('fileCount');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const mergeBtn = document.getElementById('mergeBtn');
  let selectedMergeFiles = [];

  // Watermark Logo Configurator Elements
  const logoOptionRadios = document.querySelectorAll('input[name="logoOption"]');
  const customLogoPanel = document.getElementById('customLogoPanel');
  const customLogoInput = document.getElementById('customLogoInput');
  const selectLogoBtn = document.getElementById('selectLogoBtn');
  const logoPreviewBox = document.getElementById('logoPreviewBox');
  const logoPreviewImg = document.getElementById('logoPreviewImg');
  const logoPreviewName = document.getElementById('logoPreviewName');
  const removeLogoBtn = document.getElementById('removeLogoBtn');
  let selectedCustomLogoFile = null;

  // TAB 2: SPLIT VIDEO
  const splitDropZone = document.getElementById('splitDropZone');
  const splitFileInput = document.getElementById('splitFileInput');
  const splitBrowseBtn = document.getElementById('splitBrowseBtn');
  const splitFileText = document.getElementById('splitFileText');
  const splitModeRadios = document.querySelectorAll('input[name="splitMode"]');
  const equalPartsPanel = document.getElementById('equalPartsPanel');
  const timestampRangePanel = document.getElementById('timestampRangePanel');
  const partCountSelect = document.getElementById('partCountSelect');
  const startTimeInput = document.getElementById('startTimeInput');
  const endTimeInput = document.getElementById('endTimeInput');
  const splitBtn = document.getElementById('splitBtn');
  let selectedSplitFile = null;

  // TAB 3: SOCIAL DOWNLOADER
  const socialUrlInput = document.getElementById('socialUrlInput');
  const qualitySelect = document.getElementById('qualitySelect');
  const formatSelect = document.getElementById('formatSelect');
  const socialDownloadBtn = document.getElementById('socialDownloadBtn');

  // Init Theme & Health Check
  const savedTheme = localStorage.getItem('sivateja_theme') || localStorage.getItem('lahari_theme') || 'light';
  applyTheme(savedTheme);
  checkHealth();

  // --- THEME TOGGLE LOGIC ---
  themeToggleBtn.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(newTheme);
  });

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sivateja_theme', theme);

    if (theme === 'dark') {
      themeIcon.textContent = '🌙';
      themeLabel.textContent = 'Dark Studio';
    } else {
      themeIcon.textContent = '☀️';
      themeLabel.textContent = 'Vanilla Light';
    }
  }

  // --- TAB SWITCHER ---
  tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabBtns.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(targetTab).classList.add('active');

      hideAlert();
    });
  });

  // --- HEALTH CHECK ---
  async function checkHealth() {
    try {
      const res = await fetch('/api/health');
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      if (data.status === 'healthy') {
        statusDot.className = 'status-dot status-healthy';
        statusText.textContent = 'FFmpeg & Downloader Ready';
      } else {
        statusDot.className = 'status-dot status-unhealthy';
        statusText.textContent = 'Binaries Unhealthy';
      }
    } catch (_err) {
      statusDot.className = 'status-dot status-unhealthy';
      statusText.textContent = 'API Server Offline';
    }
  }

  // ================= TAB 1: MERGE CLIPS LOGIC =================
  dropZone.addEventListener('click', (e) => {
    if (e.target !== browseBtn) fileInput.click();
  });
  browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });
  ['dragleave', 'drop'].forEach((evt) => {
    dropZone.addEventListener(evt, (e) => {
      e.preventDefault(); e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });
  dropZone.addEventListener('drop', (e) => handleMergeFilesAdded(Array.from(e.dataTransfer.files)));
  fileInput.addEventListener('change', (e) => {
    handleMergeFilesAdded(Array.from(e.target.files));
    fileInput.value = '';
  });

  function handleMergeFilesAdded(newFiles) {
    hideAlert();
    for (const file of newFiles) {
      if (selectedMergeFiles.length >= 20) {
        showAlert('Maximum 20 video files allowed per merge.');
        break;
      }
      if (!selectedMergeFiles.some((f) => f.name === file.name && f.size === file.size)) {
        selectedMergeFiles.push(file);
      }
    }
    renderMergeFileList();
  }

  function renderMergeFileList() {
    fileList.innerHTML = '';
    fileCount.textContent = selectedMergeFiles.length;

    if (selectedMergeFiles.length > 0) fileListContainer.classList.remove('hidden');
    else fileListContainer.classList.add('hidden');

    selectedMergeFiles.forEach((file, index) => {
      const li = document.createElement('li');
      li.className = 'file-item';
      li.innerHTML = `
        <div class="file-info">
          <span class="file-name">${index + 1}. ${escapeHtml(file.name)}</span>
          <span class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</span>
        </div>
        <button type="button" class="remove-file-btn" data-index="${index}" title="Remove file">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      `;
      fileList.appendChild(li);
    });

    document.querySelectorAll('.remove-file-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        selectedMergeFiles.splice(idx, 1);
        renderMergeFileList();
      });
    });

    mergeBtn.disabled = selectedMergeFiles.length < 2;
  }

  // --- WATERMARK LOGO CONFIGURATOR HANDLERS ---
  logoOptionRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.value === 'custom') {
        customLogoPanel.classList.remove('hidden');
      } else {
        customLogoPanel.classList.add('hidden');
      }
    });
  });

  selectLogoBtn.addEventListener('click', () => {
    customLogoInput.click();
  });

  customLogoInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(png|jpg|jpeg|webp)$/i)) {
        showAlert('Invalid logo image format. Allowed: PNG, JPG, WEBP');
        return;
      }

      selectedCustomLogoFile = file;
      logoPreviewName.textContent = file.name;

      const reader = new FileReader();
      reader.onload = (evt) => {
        logoPreviewImg.src = evt.target.result;
        logoPreviewBox.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  removeLogoBtn.addEventListener('click', () => {
    selectedCustomLogoFile = null;
    customLogoInput.value = '';
    logoPreviewImg.src = '';
    logoPreviewBox.classList.add('hidden');
  });

  mergeBtn.addEventListener('click', () => {
    if (selectedMergeFiles.length < 2) return;
    hideAlert();
    setProcessingUI(true, 'Uploading clips...', 'Detecting resolutions & merging with logo overlay...');

    const formData = new FormData();
    selectedMergeFiles.forEach((file) => formData.append('videos', file));

    const selectedLogoOption = document.querySelector('input[name="logoOption"]:checked')?.value;
    if (selectedLogoOption === 'custom' && selectedCustomLogoFile) {
      formData.append('logo', selectedCustomLogoFile);
    }

    sendXhrRequest('/api/videos/merge', formData, (err, data) => {
      setProcessingUI(false);
      if (err) return showAlert(err);
      showMergeResult(data);
    });
  });

  // ================= TAB 2: SPLIT VIDEO LOGIC =================
  splitDropZone.addEventListener('click', (e) => {
    if (e.target !== splitBrowseBtn) splitFileInput.click();
  });
  splitBrowseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    splitFileInput.click();
  });

  splitFileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      selectedSplitFile = e.target.files[0];
      splitFileText.textContent = `Selected: ${selectedSplitFile.name} (${(selectedSplitFile.size / 1024 / 1024).toFixed(2)} MB)`;
      splitBtn.disabled = false;
    }
  });

  splitModeRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.value === 'equal_parts') {
        equalPartsPanel.classList.remove('hidden');
        timestampRangePanel.classList.add('hidden');
      } else {
        equalPartsPanel.classList.add('hidden');
        timestampRangePanel.classList.remove('hidden');
      }
    });
  });

  splitBtn.addEventListener('click', () => {
    if (!selectedSplitFile) return;
    hideAlert();
    setProcessingUI(true, 'Uploading video file...', 'Executing fast FFmpeg split stream trimmer...');

    const selectedMode = document.querySelector('input[name="splitMode"]:checked').value;
    const formData = new FormData();
    formData.append('video', selectedSplitFile);
    formData.append('splitMode', selectedMode);
    formData.append('partCount', partCountSelect.value);
    formData.append('startTime', startTimeInput.value);
    formData.append('endTime', endTimeInput.value);

    sendXhrRequest('/api/videos/split', formData, (err, data) => {
      setProcessingUI(false);
      if (err) return showAlert(err);
      showSplitResult(data);
    });
  });

  // ================= TAB 3: SOCIAL DOWNLOADER LOGIC =================
  socialDownloadBtn.addEventListener('click', async () => {
    const url = socialUrlInput.value.trim();
    if (!url || !url.startsWith('http')) {
      return showAlert('Please enter a valid HTTP/HTTPS social media video URL.');
    }

    hideAlert();
    setProcessingUI(true, 'Connecting to social media server...', 'Fetching stream metadata & downloading...');

    try {
      const res = await fetch('/api/videos/download-social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          quality: qualitySelect.value,
          format: formatSelect.value,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        await res.text();
        throw new Error(`Server returned HTTP ${res.status} (${res.statusText || 'Bad Gateway'}). Please check if server is running.`);
      }

      setProcessingUI(false);

      if (!res.ok) {
        throw new Error(data.message || data.error || 'Social download failed');
      }

      showSocialDownloadResult(data);
    } catch (err) {
      setProcessingUI(false);
      showAlert(err.message);
    }
  });

  // ================= RENDER RESULT HELPERS =================
  function showMergeResult(data) {
    emptyResult.classList.add('hidden');
    resultBox.classList.remove('hidden');
    resultTitle.textContent = 'Merge Completed Successfully';

    resolutionBadge.textContent = `${data.resolution || '1080p'} Output`;

    resultMetrics.innerHTML = `
      <div class="metric-item"><span class="metric-label">Resolution</span><span class="metric-value highlight">${data.resolution || '1080p'}</span></div>
      <div class="metric-item"><span class="metric-label">Clips Merged</span><span class="metric-value">${data.clipCount}</span></div>
      <div class="metric-item"><span class="metric-label">Duration/Time</span><span class="metric-value">${data.processingTime}</span></div>
      <div class="metric-item"><span class="metric-label">Job ID</span><span class="metric-value code-font">${data.jobId}</span></div>
    `;

    audioPreview.classList.add('hidden');
    videoPreview.classList.remove('hidden');
    videoPreview.src = data.downloadUrl;

    downloadsContainer.innerHTML = `
      <a href="${data.downloadUrl}" class="btn-download" download>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Download Merged MP4 Video</span>
      </a>
    `;
  }

  function showSplitResult(data) {
    emptyResult.classList.add('hidden');
    resultBox.classList.remove('hidden');
    resultTitle.textContent = 'Video Split Successfully';

    resolutionBadge.textContent = `${data.segments.length} Clips Created`;

    resultMetrics.innerHTML = `
      <div class="metric-item"><span class="metric-label">Total Duration</span><span class="metric-value highlight">${data.totalDuration.toFixed(1)}s</span></div>
      <div class="metric-item"><span class="metric-label">Clips Generated</span><span class="metric-value">${data.segments.length}</span></div>
    `;

    audioPreview.classList.add('hidden');
    videoPreview.classList.remove('hidden');
    if (data.segments.length > 0) {
      videoPreview.src = data.segments[0].downloadUrl;
    }

    let downloadsHtml = '';
    data.segments.forEach((seg) => {
      downloadsHtml += `
        <div class="segment-download-item">
          <span>Part ${seg.index} (${seg.duration.toFixed(1)}s) — ${escapeHtml(seg.filename)}</span>
          <a href="${seg.downloadUrl}" class="btn-download-sm" download>Download Part ${seg.index}</a>
        </div>
      `;
    });
    downloadsContainer.innerHTML = downloadsHtml;
  }

  function showSocialDownloadResult(data) {
    emptyResult.classList.add('hidden');
    resultBox.classList.remove('hidden');
    resultTitle.textContent = `Downloaded from ${data.platform || 'Social Media'}`;

    resolutionBadge.textContent = data.resolution || 'Media Downloaded';

    resultMetrics.innerHTML = `
      <div class="metric-item"><span class="metric-label">Title</span><span class="metric-value highlight">${escapeHtml(data.title)}</span></div>
      <div class="metric-item"><span class="metric-label">Platform</span><span class="metric-value">${data.platform}</span></div>
      <div class="metric-item"><span class="metric-label">Type / Resolution</span><span class="metric-value">${data.mediaType.toUpperCase()} (${data.resolution})</span></div>
    `;

    if (data.mediaType === 'audio') {
      videoPreview.classList.add('hidden');
      audioPreview.classList.remove('hidden');
      audioPreview.src = data.downloadUrl;
    } else {
      audioPreview.classList.add('hidden');
      videoPreview.classList.remove('hidden');
      videoPreview.src = data.downloadUrl;
    }

    downloadsContainer.innerHTML = `
      <a href="${data.downloadUrl}" class="btn-download" download>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <span>Download ${data.mediaType.toUpperCase()} File (${escapeHtml(data.filename)})</span>
      </a>
    `;
  }

  // ================= COMMON HELPERS =================
  function sendXhrRequest(url, formData, callback) {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        progressBarFill.style.width = `${percent}%`;
        progressPercent.textContent = `${percent}%`;
        if (percent === 100) {
          progressStage.textContent = 'Upload complete. Processing FFmpeg pipeline...';
          spinnerWrapper.classList.remove('hidden');
        } else {
          progressStage.textContent = `Uploading file (${percent}%)...`;
        }
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          callback(null, response);
        } catch (_e) {
          callback('Failed to parse server response.');
        }
      } else {
        let errMessage = 'Processing request failed.';
        try {
          const errData = JSON.parse(xhr.responseText);
          errMessage = errData.message || errData.error || errMessage;
        } catch (_e) {
          errMessage = `Server error (${xhr.status})`;
        }
        callback(errMessage);
      }
    });

    xhr.addEventListener('error', () => callback('Network error occurred.'));
    xhr.addEventListener('abort', () => callback('Request was cancelled.'));

    xhr.open('POST', url, true);
    xhr.timeout = 330000;
    xhr.send(formData);
  }

  function setProcessingUI(isProcessing, stageText = 'Processing...', detailsText = 'Executing media pipeline...') {
    if (isProcessing) {
      progressSection.classList.remove('hidden');
      spinnerWrapper.classList.add('hidden');
      progressBarFill.style.width = '0%';
      progressPercent.textContent = '0%';
      progressStage.textContent = stageText;
      spinnerText.textContent = detailsText;
    } else {
      progressSection.classList.add('hidden');
    }
  }

  function showAlert(message) {
    alertBox.textContent = message;
    alertBox.className = 'alert alert-error';
    alertBox.classList.remove('hidden');
  }

  function hideAlert() {
    alertBox.classList.add('hidden');
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
});
