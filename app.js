// app.js - 위임장 온라인 작성 및 서명 로직

document.addEventListener('DOMContentLoaded', () => {
  // Lucide 아이콘 초기화
  if (window.lucide) {
    lucide.createIcons();
  }

  // --- 엘리먼트 참조 ---
  const inputAcademy = document.getElementById('inputAcademy');
  const inputName = document.getElementById('inputName');
  const inputReason = document.getElementById('inputReason');
  const inputYear = document.getElementById('inputYear');
  const inputMonth = document.getElementById('inputMonth');
  const inputDay = document.getElementById('inputDay');

  const docAcademy = document.getElementById('docAcademy');
  const docName = document.getElementById('docName');
  const docReason = document.getElementById('docReason');
  const docYear = document.getElementById('docYear');
  const docMonth = document.getElementById('docMonth');
  const docDay = document.getElementById('docDay');
  const docSignName = document.getElementById('docSignName');
  const docSignatureSlot = document.getElementById('docSignatureSlot');
  const a4Document = document.getElementById('a4Document');

  // 버튼들
  const setTodayBtn = document.getElementById('setTodayBtn');
  const setGeneralMeetingBtn = document.getElementById('setGeneralMeetingBtn');
  const clearSignBtn = document.getElementById('clearSignBtn');
  const tabDrawSign = document.getElementById('tabDrawSign');
  const tabSealSign = document.getElementById('tabSealSign');
  const drawSignContainer = document.getElementById('drawSignContainer');
  const sealSignContainer = document.getElementById('sealSignContainer');
  const sealCanvas = document.getElementById('sealCanvas');
  const sealStyleSelect = document.getElementById('sealStyleSelect');
  const applySealBtn = document.getElementById('applySealBtn');
  const canvasPlaceholder = document.getElementById('canvasPlaceholder');

  // 내보내기 버튼들
  const actionSaveImgBtn = document.getElementById('actionSaveImgBtn');
  const actionSavePdfBtn = document.getElementById('actionSavePdfBtn');
  const actionPrintBtn = document.getElementById('actionPrintBtn');
  const headerImgBtn = document.getElementById('headerImgBtn');
  const headerPdfBtn = document.getElementById('headerPdfBtn');
  const headerPrintBtn = document.getElementById('headerPrintBtn');

  // 모바일 토글
  const mobileViewToggle = document.getElementById('mobileViewToggle');
  const mobileToggleText = document.getElementById('mobileToggleText');
  const formSection = document.getElementById('formSection');
  const previewSection = document.getElementById('previewSection');

  // 모달
  const loadingModal = document.getElementById('loadingModal');
  const loadingTitle = document.getElementById('loadingTitle');
  const loadingDesc = document.getElementById('loadingDesc');
  const resultModal = document.getElementById('resultModal');
  const closeResultModal = document.getElementById('closeResultModal');
  const resultImagePreview = document.getElementById('resultImagePreview');
  const modalDownloadLink = document.getElementById('modalDownloadLink');
  const modalShareBtn = document.getElementById('modalShareBtn');

  // --- 날짜 초기 설정 ---
  const today = new Date();
  inputYear.value = today.getFullYear();
  inputMonth.value = today.getMonth() + 1;
  inputDay.value = today.getDate();

  function updateDatePreview() {
    docYear.textContent = inputYear.value || '2026';
    docMonth.textContent = inputMonth.value ? String(inputMonth.value).padStart(2, ' ') : '    ';
    docDay.textContent = inputDay.value ? String(inputDay.value).padStart(2, ' ') : '    ';
  }
  updateDatePreview();

  setTodayBtn.addEventListener('click', () => {
    const now = new Date();
    inputYear.value = now.getFullYear();
    inputMonth.value = now.getMonth() + 1;
    inputDay.value = now.getDate();
    updateDatePreview();
  });

  setGeneralMeetingBtn.addEventListener('click', () => {
    inputYear.value = '2026';
    inputMonth.value = '11';
    inputDay.value = '14';
    updateDatePreview();
  });

  // --- 실시간 텍스트 동기화 ---
  inputAcademy.addEventListener('input', () => {
    docAcademy.textContent = inputAcademy.value || '';
  });

  inputName.addEventListener('input', () => {
    const val = inputName.value.trim();
    docName.textContent = val;
    docSignName.textContent = val || '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';
    renderSealPreview();
  });

  inputReason.addEventListener('input', () => {
    docReason.textContent = inputReason.value || '';
  });

  inputYear.addEventListener('input', updateDatePreview);
  inputMonth.addEventListener('input', updateDatePreview);
  inputDay.addEventListener('input', updateDatePreview);

  // 사유 칩 클릭 시
  document.querySelectorAll('.reason-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      inputReason.value = chip.textContent.trim() + '으로 인한 불참';
      docReason.textContent = inputReason.value;
    });
  });

  // --- 서명 패드 (SignaturePad) 설정 ---
  const signatureCanvas = document.getElementById('signatureCanvas');
  let signaturePad = null;
  let currentColor = '#1e293b';

  function resizeCanvas() {
    const ratio = Math.max(window.devicePixelRatio || 1, 1);
    const rect = signatureCanvas.getBoundingClientRect();
    signatureCanvas.width = rect.width * ratio;
    signatureCanvas.height = rect.height * ratio;
    const ctx = signatureCanvas.getContext('2d');
    ctx.scale(ratio, ratio);

    if (signaturePad) {
      signaturePad.clear();
      syncSignatureToDoc();
    }
  }

  signaturePad = new SignaturePad(signatureCanvas, {
    backgroundColor: 'rgba(255, 255, 255, 0)',
    penColor: currentColor,
    minWidth: 1.5,
    maxWidth: 3.5,
  });

  // 윈도우 리사이즈 시 캔버스 조정
  window.addEventListener('resize', () => {
    // 서명 데이터 임시 저장
    if (!signaturePad.isEmpty()) {
      const data = signaturePad.toData();
      resizeCanvas();
      signaturePad.fromData(data);
    } else {
      resizeCanvas();
    }
  });
  resizeCanvas();

  signaturePad.addEventListener('beginStroke', () => {
    if (canvasPlaceholder) {
      canvasPlaceholder.style.display = 'none';
    }
  });

  signaturePad.addEventListener('endStroke', () => {
    syncSignatureToDoc();
  });

  function syncSignatureToDoc() {
    docSignatureSlot.innerHTML = '';
    if (!signaturePad.isEmpty()) {
      const signDataUrl = signaturePad.toDataURL('image/png');
      const img = document.createElement('img');
      img.src = signDataUrl;
      img.alt = '서명';
      img.className = 'max-w-full max-h-full object-contain';
      img.style.filter = 'contrast(120%)';
      docSignatureSlot.appendChild(img);
    }
  }

  // 지우기 버튼
  clearSignBtn.addEventListener('click', () => {
    signaturePad.clear();
    docSignatureSlot.innerHTML = '';
    if (canvasPlaceholder) {
      canvasPlaceholder.style.display = 'flex';
    }
  });

  // 색상 선택기
  document.querySelectorAll('.color-pick').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.color-pick').forEach(b => b.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-1'));
      btn.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-1');
      currentColor = btn.dataset.color;
      signaturePad.penColor = currentColor;
    });
  });

  // --- 전자 도장(인) 자동 생성 모드 ---
  let isSealMode = false;

  tabDrawSign.addEventListener('click', () => {
    isSealMode = false;
    tabDrawSign.classList.add('bg-white', 'text-indigo-700', 'shadow-sm');
    tabDrawSign.classList.remove('text-slate-600');
    tabSealSign.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
    tabSealSign.classList.add('text-slate-600');

    drawSignContainer.classList.remove('hidden');
    sealSignContainer.classList.add('hidden');
    syncSignatureToDoc();
  });

  tabSealSign.addEventListener('click', () => {
    isSealMode = true;
    tabSealSign.classList.add('bg-white', 'text-indigo-700', 'shadow-sm');
    tabSealSign.classList.remove('text-slate-600');
    tabDrawSign.classList.remove('bg-white', 'text-indigo-700', 'shadow-sm');
    tabDrawSign.classList.add('text-slate-600');

    sealSignContainer.classList.remove('hidden');
    drawSignContainer.classList.add('hidden');
    renderSealPreview();
  });

  function renderSealPreview() {
    const ctx = sealCanvas.getContext('2d');
    const w = sealCanvas.width;
    const h = sealCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const name = inputName.value.trim() || '홍길동';
    const style = sealStyleSelect.value;

    ctx.save();
    ctx.strokeStyle = '#dc2626';
    ctx.fillStyle = '#dc2626';
    ctx.lineWidth = 4;

    const centerX = w / 2;
    const centerY = h / 2;

    if (style === 'circle') {
      ctx.beginPath();
      ctx.arc(centerX, centerY, 42, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === 'oval') {
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, 44, 34, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (style === 'square') {
      ctx.beginPath();
      ctx.roundRect(8, 8, w - 16, h - 16, 8);
      ctx.stroke();
    }

    // 도장 글자 배치
    ctx.font = 'bold 22px "Gowun Batang", "Batang", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 2자~4자 이름에 맞춘 배치
    let text = name;
    if (text.length === 2) {
      text = text + '인';
    } else if (text.length === 3) {
      text = text + '인';
    }

    if (text.length === 3) {
      // 세로쓰기 또는 가로쓰기
      ctx.fillText(text[0], centerX, centerY - 22);
      ctx.fillText(text[1], centerX, centerY);
      ctx.fillText(text[2], centerX, centerY + 22);
    } else if (text.length === 4) {
      // 전통 2x2 직인 배치 (오른쪽 위부터 아래로, 왼쪽 위부터 아래로 또는 가로)
      // 한국 도장: 우상->우하->좌상->좌하
      ctx.font = 'bold 20px "Gowun Batang", "Batang", serif';
      ctx.fillText(text[0], centerX + 16, centerY - 15);
      ctx.fillText(text[1], centerX + 16, centerY + 17);
      ctx.fillText(text[2], centerX - 16, centerY - 15);
      ctx.fillText(text[3], centerX - 16, centerY + 17);
    } else {
      ctx.font = 'bold 16px "Gowun Batang", "Batang", serif';
      ctx.fillText(text.slice(0, 4), centerX, centerY);
    }

    ctx.restore();
  }

  sealStyleSelect.addEventListener('change', renderSealPreview);

  applySealBtn.addEventListener('click', () => {
    if (!inputName.value.trim()) {
      alert('위임자 성명을 먼저 입력해주세요.');
      inputName.focus();
      return;
    }
    renderSealPreview();
    const sealDataUrl = sealCanvas.toDataURL('image/png');
    docSignatureSlot.innerHTML = '';
    const img = document.createElement('img');
    img.src = sealDataUrl;
    img.alt = '직인';
    img.className = 'w-16 h-16 object-contain';
    img.style.transform = 'rotate(-4deg)';
    docSignatureSlot.appendChild(img);
  });

  // --- 유효성 검사 헬퍼 ---
  function validateForm() {
    if (!inputAcademy.value.trim()) {
      alert('학원명을 입력해주세요.');
      inputAcademy.focus();
      return false;
    }
    if (!inputName.value.trim()) {
      alert('위임자(원장님) 성명을 입력해주세요.');
      inputName.focus();
      return false;
    }
    if (docSignatureSlot.children.length === 0) {
      alert('서명을 하거나 도장 생성을 통해 날인해주세요.');
      return false;
    }
    return true;
  }

  // --- 모바일 미리보기 토글 ---
  let isMobilePreview = false;
  mobileViewToggle.addEventListener('click', () => {
    isMobilePreview = !isMobilePreview;
    if (isMobilePreview) {
      formSection.classList.add('hidden');
      previewSection.classList.remove('hidden');
      mobileToggleText.textContent = '수정하기';
      if (window.lucide) {
        mobileViewToggle.querySelector('i').setAttribute('data-lucide', 'edit-3');
        lucide.createIcons();
      }
      // 토글 즉시 및 렌더링 후 화면 맞춤 3중 보정
      updateA4Scale();
      requestAnimationFrame(updateA4Scale);
      setTimeout(updateA4Scale, 60);
    } else {
      formSection.classList.remove('hidden');
      previewSection.classList.add('hidden');
      mobileToggleText.textContent = '미리보기';
      if (window.lucide) {
        mobileViewToggle.querySelector('i').setAttribute('data-lucide', 'eye');
        lucide.createIcons();
      }
    }
  });

  // --- 모바일 화면 크기에 맞춘 A4 실시간 자동 스케일링 (완전 잘림 방지 박스 모델) ---
  const a4ScaleWrapper = document.getElementById('a4ScaleWrapper');
  const a4ScaleBox = document.getElementById('a4ScaleBox');
  const previewScaleText = document.getElementById('previewScaleText');

  function updateA4Scale() {
    if (!a4ScaleWrapper || !a4Document) return;

    // 모바일 탭 등으로 previewSection이 숨겨져 있을 때는 스킵
    if (previewSection.classList.contains('hidden')) return;

    const baseWidth = 595;
    const baseHeight = 842;

    // 스마트폰 뷰포트 실제 가로폭 계산
    const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
    const wrapperWidth = a4ScaleWrapper.clientWidth > 0 ? a4ScaleWrapper.clientWidth : viewportWidth;
    const availableWidth = Math.min(viewportWidth - 24, wrapperWidth - 12);

    if (availableWidth < baseWidth && availableWidth > 50) {
      const scale = Math.max(availableWidth / baseWidth, 0.4);
      const scaledW = Math.round(baseWidth * scale);
      const scaledH = Math.round(baseHeight * scale);

      // 점유 박스 크기를 축소된 크기로 딱 맞춤 (중앙 정렬 유지 & 좌우 잘림 0%)
      if (a4ScaleBox) {
        a4ScaleBox.style.width = `${scaledW}px`;
        a4ScaleBox.style.height = `${scaledH}px`;
      }
      a4ScaleWrapper.style.height = `${scaledH + 16}px`;

      // 문서는 좌상단(0, 0) 기준으로 정확히 축소
      a4Document.style.transform = `scale(${scale})`;
      a4Document.style.transformOrigin = '0 0';
      a4Document.style.left = '0';
      a4Document.style.top = '0';

      if (previewScaleText) {
        previewScaleText.textContent = `배율: ${Math.round(scale * 100)}% (화면맞춤)`;
      }
    } else {
      if (a4ScaleBox) {
        a4ScaleBox.style.width = `${baseWidth}px`;
        a4ScaleBox.style.height = `${baseHeight}px`;
      }
      a4ScaleWrapper.style.height = 'auto';
      a4Document.style.transform = 'none';
      if (previewScaleText) {
        previewScaleText.textContent = '배율: 100%';
      }
    }
  }

  // 화면 크기에 따른 초기 클래스 정리
  function handleScreenResize() {
    if (window.innerWidth >= 1024) {
      formSection.classList.remove('hidden');
      previewSection.classList.remove('hidden');
    } else {
      if (!isMobilePreview) {
        formSection.classList.remove('hidden');
        previewSection.classList.add('hidden');
      }
    }
    updateA4Scale();
  }
  window.addEventListener('resize', handleScreenResize);
  window.addEventListener('orientationchange', () => {
    setTimeout(handleScreenResize, 100);
    setTimeout(handleScreenResize, 300);
  });
  setTimeout(handleScreenResize, 100);

  // --- 문서 캡처 공통 함수 (고해상도 Canvas 생성) ---
  async function generateDocumentCanvas() {
    // 폰트가 완전히 로드되도록 대기
    if (document.fonts) {
      await document.fonts.ready;
    }

    loadingModal.classList.remove('hidden');
    loadingTitle.textContent = '고화질 위임장 렌더링 중...';
    loadingDesc.textContent = '선명한 출력을 위해 문서를 생성하고 있습니다.';

    // 임시로 미리보기 섹션이 모바일에서 숨겨져 있다면 일시 표시
    const wasPreviewHidden = previewSection.classList.contains('hidden');
    if (wasPreviewHidden) {
      previewSection.classList.remove('hidden');
    }

    // 캡처 시에는 스케일 해제하여 원본 A4 고해상도(595x842)로 선명하게 캡처
    const prevTransform = a4Document.style.transform;
    const prevOrigin = a4Document.style.transformOrigin;
    const prevBoxW = a4ScaleBox ? a4ScaleBox.style.width : '';
    const prevBoxH = a4ScaleBox ? a4ScaleBox.style.height : '';
    const prevWrapperH = a4ScaleWrapper ? a4ScaleWrapper.style.height : '';

    a4Document.style.transform = 'none';
    if (a4ScaleBox) {
      a4ScaleBox.style.width = '595px';
      a4ScaleBox.style.height = '842px';
    }
    if (a4ScaleWrapper) {
      a4ScaleWrapper.style.height = 'auto';
    }

    try {
      const canvas = await html2canvas(a4Document, {
        scale: 2.5, // 2.5배 고해상도 (약 1500x2100 px, 인쇄 및 카톡 전송 최적)
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      return canvas;
    } finally {
      a4Document.style.transform = prevTransform;
      a4Document.style.transformOrigin = prevOrigin;
      if (a4ScaleBox) {
        a4ScaleBox.style.width = prevBoxW;
        a4ScaleBox.style.height = prevBoxH;
      }
      if (a4ScaleWrapper) {
        a4ScaleWrapper.style.height = prevWrapperH;
      }
      if (wasPreviewHidden) {
        previewSection.classList.add('hidden');
      }
      loadingModal.classList.add('hidden');
    }
  }

  // --- 1. 카카오톡/문자 전송용 이미지 저장 ---
  async function saveAsImage() {
    if (!validateForm()) return;

    try {
      const canvas = await generateDocumentCanvas();
      const academyName = inputAcademy.value.trim().replace(/\s+/g, '_');
      const senderName = inputName.value.trim();
      const fileName = `2026_위임장_${academyName}_${senderName}.png`;

      const dataUrl = canvas.toDataURL('image/png', 0.95);

      // 모달에 이미지 표시
      resultImagePreview.src = dataUrl;
      modalDownloadLink.href = dataUrl;
      modalDownloadLink.download = fileName;

      // Web Share API가 지원되고 파일 공유가 가능한 경우 (주로 모바일)
      if (navigator.canShare && navigator.canShare({ files: [] })) {
        modalShareBtn.classList.remove('hidden');
        modalShareBtn.onclick = async () => {
          try {
            canvas.toBlob(async (blob) => {
              const file = new File([blob], fileName, { type: 'image/png' });
              await navigator.share({
                title: '임시총회 위임장',
                text: `${academyName} ${senderName} 원장 임시총회 위임장입니다.`,
                files: [file],
              });
            }, 'image/png');
          } catch (err) {
            console.warn('Share canceled or failed', err);
          }
        };
      } else {
        modalShareBtn.classList.add('hidden');
      }

      // 모달 표시
      resultModal.classList.remove('hidden');

      // PC 브라우저인 경우 바로 다운로드 트리거도 함께 수행
      if (window.innerWidth >= 768) {
        const downloadLink = document.createElement('a');
        downloadLink.href = dataUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
    } catch (error) {
      console.error(error);
      alert('이미지 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  }

  // --- 2. PDF 다운로드 ---
  async function saveAsPdf() {
    if (!validateForm()) return;

    try {
      const canvas = await generateDocumentCanvas();
      const academyName = inputAcademy.value.trim().replace(/\s+/g, '_');
      const senderName = inputName.value.trim();
      const fileName = `2026_위임장_${academyName}_${senderName}.pdf`;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(fileName);
    } catch (error) {
      console.error(error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  }

  // --- 3. 즉시 인쇄 (PDF/이미지와 100% 동일한 고해상도 A4 렌더링 인쇄) ---
  async function printDocument() {
    if (!validateForm()) return;

    try {
      // PDF 저장 시 생성하는 완벽한 고화질 캔버스를 그대로 렌더링
      const canvas = await generateDocumentCanvas();
      const imgData = canvas.toDataURL('image/png', 1.0);

      let printFrame = document.getElementById('a4PrintFrame');
      if (printFrame) {
        printFrame.remove();
      }

      printFrame = document.createElement('iframe');
      printFrame.id = 'a4PrintFrame';
      printFrame.style.position = 'fixed';
      printFrame.style.left = '-9999px';
      printFrame.style.top = '-9999px';
      printFrame.style.width = '0px';
      printFrame.style.height = '0px';
      printFrame.style.border = 'none';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>2026 임시총회 위임장</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: #ffffff;
      overflow: hidden;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .print-page {
      width: 210mm;
      height: 297mm;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    img {
      width: 210mm;
      height: 297mm;
      display: block;
      object-fit: contain;
    }
  </style>
</head>
<body>
  <div class="print-page">
    <img id="printTargetImg" src="${imgData}" alt="위임장">
  </div>
</body>
</html>`);
      frameDoc.close();

      const printImg = frameDoc.getElementById('printTargetImg');
      const startPrint = () => {
        setTimeout(() => {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        }, 150);
      };

      if (printImg.complete) {
        startPrint();
      } else {
        printImg.onload = startPrint;
      }
    } catch (error) {
      console.error(error);
      window.print();
    }
  }

  // 이벤트 바인딩
  actionSaveImgBtn.addEventListener('click', saveAsImage);
  headerImgBtn.addEventListener('click', saveAsImage);

  actionSavePdfBtn.addEventListener('click', saveAsPdf);
  headerPdfBtn.addEventListener('click', saveAsPdf);

  actionPrintBtn.addEventListener('click', printDocument);
  headerPrintBtn.addEventListener('click', printDocument);

  closeResultModal.addEventListener('click', () => {
    resultModal.classList.add('hidden');
  });

  resultModal.addEventListener('click', (e) => {
    if (e.target === resultModal) {
      resultModal.classList.add('hidden');
    }
  });

});
