const QUESTIONS=[
"¿Qué conflicto mueve realmente la historia?","¿Qué decisión cambia el rumbo de la historia y por qué?",
"Cuenta un detalle importante que no aparezca en la portada ni en la contraportada.",
"¿Qué personaje influye más en el protagonista? Explica cómo.",
"¿Qué ocurre justo antes del desenlace y por qué es importante?",
"¿Qué lugar tiene más peso en la historia y qué sucede allí?",
"¿Qué personaje evoluciona más desde el principio hasta el final?",
"¿Qué objeto, pista o símbolo resulta importante en la historia?",
"¿Cuál es la escena clave del libro y qué cambia después de ella?",
"¿A qué tipo de lector o lectora recomendarías este libro y por qué?",
"¿Qué habrías hecho tú en el lugar del protagonista? Justifica tu respuesta.",
"¿Qué tema importante aparece además de la historia principal?"];
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const form=$("#readerForm"); let step=1,mode="text",question="",recorder,stream,chunks=[],audioBlob=null,seconds=0,timerId;
question=QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];$("#question").textContent=question;

function words(v){return v.trim()?v.trim().split(/\s+/).length:0}
function update(i,o,m){const n=words(i.value);o.textContent=`${n} / ${m} palabras`;o.classList.toggle("over",n>m)}
$("#resumen").oninput=()=>update($("#resumen"),$("#summaryCount"),55);
$("#respuesta").oninput=()=>update($("#respuesta"),$("#answerCount"),75);
$$("[data-next]").forEach(b=>b.onclick=()=>go(+b.dataset.next));$$("[data-back]").forEach(b=>b.onclick=()=>go(+b.dataset.back));
function go(n){if(n>step&&!valid(step))return;$$(".card").forEach(c=>c.classList.remove("active"));$(`.card[data-step="${n}"]`).classList.add("active");$$(".progress span").forEach((x,i)=>x.classList.toggle("active",i<n));step=n;scrollTo({top:0,behavior:"smooth"})}
function valid(s){clearMsg();if(s===1){for(const id of["codigo","titulo","autor"])if(!$("#"+id).value.trim()){show("Completa todos los datos del libro.");return false}if(!$('input[name="rating"]:checked')){show("Selecciona una valoración.");return false}}if(s===2){const n=words($("#resumen").value);if(!n){show("Escribe un resumen.");return false}if(n>55){show("El resumen supera 55 palabras.");return false}}if(s===3){if(mode==="text"){const n=words($("#respuesta").value);if(!n){show("Escribe una respuesta.");return false}if(n>75){show("La respuesta supera 75 palabras.");return false}}else if(!audioBlob){show("Graba el audio antes de enviar.");return false}}return true}
$("#textTab").onclick=()=>setMode("text");$("#audioTab").onclick=()=>setMode("audio");
function setMode(m){mode=m;$("#textTab").classList.toggle("active",m==="text");$("#audioTab").classList.toggle("active",m==="audio");$("#textPanel").classList.toggle("hidden",m!=="text");$("#audioPanel").classList.toggle("hidden",m!=="audio")}
$("#recordBtn").onclick=async()=>{if(recorder?.state==="recording"){recorder.stop();return}try{stream=await navigator.mediaDevices.getUserMedia({audio:true});chunks=[];audioBlob=null;const t=MediaRecorder.isTypeSupported("audio/webm;codecs=opus")?"audio/webm;codecs=opus":"audio/webm";recorder=new MediaRecorder(stream,{mimeType:t});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data)};recorder.onstop=()=>{stopTimer();audioBlob=new Blob(chunks,{type:recorder.mimeType});$("#preview").src=URL.createObjectURL(audioBlob);$("#preview").classList.remove("hidden");$("#clearBtn").classList.remove("hidden");$("#recordBtn").textContent="🎙️ Volver a grabar";stream.getTracks().forEach(t=>t.stop())};recorder.start();$("#recordBtn").textContent="⏹️ Detener";startTimer()}catch(e){show("No se ha podido acceder al micrófono. Revisa el permiso del navegador.")}};
$("#clearBtn").onclick=()=>{audioBlob=null;$("#preview").classList.add("hidden");$("#clearBtn").classList.add("hidden");$("#recordBtn").textContent="🎙️ Empezar a grabar";seconds=0;tick()};
function startTimer(){seconds=0;tick();timerId=setInterval(()=>{seconds++;tick();if(seconds>=60&&recorder?.state==="recording")recorder.stop()},1000)}function stopTimer(){clearInterval(timerId)}function tick(){$("#timer").textContent=`00:${String(seconds).padStart(2,"0")}`}
function dataUrl(blob){return new Promise((ok,no)=>{const r=new FileReader;r.onload=()=>ok(r.result);r.onerror=no;r.readAsDataURL(blob)})}

form.onsubmit=async e=>{e.preventDefault();if(!valid(3))return;if(!APP_CONFIG.backendUrl.includes("/exec")){show("La web aún no está conectada al backend.");return}
const btn=$("#submitBtn");btn.textContent="Enviando…";form.classList.add("loading");
try{
 const payload={accessKey:APP_CONFIG.accessKey,callbackUrl:new URL("callback.html",location.href).href,codigo:$("#codigo").value.trim().toUpperCase(),grupo:"6ºB",titulo:$("#titulo").value.trim(),autor:$("#autor").value.trim(),valoracion:$('input[name="rating"]:checked').value,resumen:$("#resumen").value.trim(),pregunta:question,tipoRespuesta:mode,respuestaTexto:mode==="text"?$("#respuesta").value.trim():"",audioDataUrl:mode==="audio"?await dataUrl(audioBlob):""};
 const sf=$("#senderForm");sf.action=APP_CONFIG.backendUrl;sf.innerHTML="";
 const input=document.createElement("input");input.type="hidden";input.name="payload";input.value=JSON.stringify(payload);sf.appendChild(input);sf.submit();
 setTimeout(()=>{if(form.classList.contains("loading")){form.classList.remove("loading");btn.textContent="Registrar mi lectura";show("El envío tarda demasiado. Comprueba la conexión y la URL del backend.")}},20000);
}catch(err){form.classList.remove("loading");btn.textContent="Registrar mi lectura";show("No se pudo preparar el envío.")}};
window.addEventListener("message",e=>{if(e.origin!==location.origin||!e.data||e.data.source!=="lectura-orbita-callback")return;form.classList.remove("loading");$("#submitBtn").textContent="Registrar mi lectura";if(e.data.ok){$$(".card").forEach(c=>c.classList.remove("active"));$("#success").classList.add("active");$$(".progress span").forEach(x=>x.classList.add("active"))}else show(e.data.message||"No se pudo guardar.")});
$("#again").onclick=()=>{form.reset();audioBlob=null;question=QUESTIONS[Math.floor(Math.random()*QUESTIONS.length)];$("#question").textContent=question;setMode("text");go(1);update($("#resumen"),$("#summaryCount"),55);update($("#respuesta"),$("#answerCount"),75)};
function show(t){const m=$("#message");m.textContent=t;m.className="message error";m.scrollIntoView({behavior:"smooth",block:"center"})}function clearMsg(){$("#message").className="message";$("#message").textContent=""}