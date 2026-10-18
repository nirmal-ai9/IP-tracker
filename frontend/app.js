(() => {
  const $ = id => document.getElementById(id);
  const apiUrl = window.ORBIT_CONFIG && window.ORBIT_CONFIG.API_URL;
  let globe = null, latestIp = null, toastTimer;
  function toast(message) {
    const node = $('toast'); node.textContent = message; node.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }
  function setText(id, value) { $(id).textContent = value == null || value === '' ? 'Unavailable' : value; }
  function fmt(value, digits = 3) { const n = Number(value); return Number.isFinite(n) ? n.toFixed(digits) : null; }
  function initGlobe(lat, lng) {
    if (typeof Globe !== 'function') { toast('3D globe could not load; check your connection.'); return; }
    const target = $('globeViz'); target.innerHTML = '';
    if (!globe) {
      globe = Globe()(target).backgroundColor('rgba(0,0,0,0)').showAtmosphere(true)
        .atmosphereColor('#6dded6').atmosphereAltitude(0.16)
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .bumpImageUrl('https://unpkg.com/three-globe/example/img/earth-topology.png')
        .pointColor(() => '#7ce9df').pointAltitude(0.12).pointRadius(0.55)
        .ringColor(() => t => `rgba(124,233,223,${1-t})`).ringMaxRadius(5)
        .ringPropagationSpeed(2).ringRepeatPeriod(1000);
      window.addEventListener('resize', () => { if (globe) globe.width(target.clientWidth).height(target.clientHeight); });
    }
    globe.width(target.clientWidth).height(target.clientHeight)
      .pointsData([{ lat, lng, size: 0.8, color: '#7ce9df' }])
      .ringsData([{ lat, lng, maxR: 5 }]).pointOfView({ lat, lng, altitude: 1.65 }, 1200);
    $('coordBadge').textContent = `LAT ${fmt(lat, 2)} / LNG ${fmt(lng, 2)}`;
  }
  async function detect() {
    if (!apiUrl || apiUrl.includes('YOUR-VERCEL-PROJECT')) { toast('Set the Vercel API URL in frontend/config.js first.'); return; }
    $('detectBtn').disabled = true; $('detectBtn').textContent = '◌ Detecting connection…'; setText('statusText', 'Request in progress…');
    const start = performance.now();
    try {
      const response = await fetch(apiUrl, { method: 'GET', cache: 'no-store' });
      const elapsed = Math.round(performance.now() - start);
      if (!response.ok) throw new Error(`API returned ${response.status}`);
      const d = await response.json(); latestIp = d.ip || null;
      setText('ipValue', d.ip); setText('ipType', d.ip ? 'Public network address' : 'IP unavailable'); $('copyBtn').disabled = !latestIp;
      const place = [d.city, d.region].filter(Boolean); setText('locationValue', place.length ? place.join(', ') : 'Location unavailable');
      setText('countryValue', d.country || '—');
      const lat = fmt(d.latitude), lng = fmt(d.longitude); setText('coordinatesValue', lat !== null && lng !== null ? `${lat}, ${lng}` : 'Unavailable');
      setText('ispValue', d.isp || 'Not provided by host'); setText('latencyValue', String(elapsed)); setText('sourceValue', d.source || 'Request metadata'); setText('statusText', 'Updated just now');
      if (d.latitude != null && d.longitude != null && Number.isFinite(Number(d.latitude)) && Number.isFinite(Number(d.longitude))) initGlobe(Number(d.latitude), Number(d.longitude));
      else $('coordBadge').textContent = 'LOCATION NOT AVAILABLE';
      toast('Connection details updated.');
    } catch (e) { setText('statusText', 'Could not connect'); toast(e.message || 'Request failed. Check API URL and CORS settings.'); }
    finally { $('detectBtn').disabled = false; $('detectBtn').innerHTML = '<span>◎</span> Detect my connection <b>↗</b>'; }
  }
  $('detectBtn').addEventListener('click', detect); $('refreshBtn').addEventListener('click', detect);
  $('copyBtn').addEventListener('click', async () => {
    if (!latestIp) return;
    try { await navigator.clipboard.writeText(latestIp); toast('IP address copied.'); }
    catch (_) { toast('Clipboard unavailable in this browser.'); }
  });
})();
