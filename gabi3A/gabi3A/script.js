function openScreen(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// CALENDÁRIO
let date = new Date();
let month = date.getMonth();
let year = date.getFullYear();

const monthNames = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"
];

function renderCalendar(){
  const monthYear = document.getElementById("monthYear");
  const calendar = document.getElementById("calendar");

  monthYear.innerText = `${monthNames[month]} ${year}`;
  calendar.innerHTML = "";

  const firstDay = new Date(year,month,1).getDay();
  const totalDays = new Date(year,month+1,0).getDate();

  for(let i=0;i<firstDay;i++){
    const empty=document.createElement("div");
    calendar.appendChild(empty);
  }

  for(let d=1; d<=totalDays; d++){
    const btn=document.createElement("button");
    btn.innerText=d;
    if(d===date.getDate() && month===date.getMonth() && year===date.getFullYear()){
      btn.style.background="#ffb74d";
      btn.style.color="white";
    }
    calendar.appendChild(btn);
  }
}

function prevMonth(){
  month--;
  if(month<0){month=11;year--;}
  renderCalendar();
}
function nextMonth(){
  month++;
  if(month>11){month=0;year++;}
  renderCalendar();
}
renderCalendar();

// --- CADERNOS DIGITAIS ---

let cadernos = JSON.parse(localStorage.getItem("cadernosLoopy")) || [];

// elementos
const listaCadernos = document.getElementById("listaCadernos");
const novoBtn = document.getElementById("novoCadernoBtn");
const buscarInput = document.getElementById("buscarCaderno");
const editor = document.getElementById("editorCaderno");
const tituloInput = document.getElementById("tituloCaderno");
const textoCaderno = document.getElementById("textoCaderno");
const voltarBtn = document.getElementById("voltarBtn");
const deletarBtn = document.getElementById("deletarBtn");

let cadernoAtual = null;

function salvarCadernos(){
  localStorage.setItem("cadernosLoopy", JSON.stringify(cadernos));
}

function trechoDoTexto(text){
  if(!text) return '';
  const lim = 100;
  const t = text.replace(/\s+/g,' ').trim();
  return t.length > lim ? t.slice(0, lim).trim() + '...' : t;
}

function criarItemCadernoDOM(cad, idx){
  const item = document.createElement('div');
  item.className = 'caderno-item';
  item.dataset.index = idx;

  const meta = document.createElement('div');
  meta.className = 'caderno-meta';

  const t = document.createElement('div');
  t.className = 'titulo-item';
  t.textContent = cad.nome || `Caderno #${idx+1}`;

  const tt = document.createElement('div');
  tt.className = 'trecho';
  tt.textContent = trechoDoTexto(cad.texto);

  meta.appendChild(t);
  meta.appendChild(tt);

  const actions = document.createElement('div');
  actions.className = 'item-actions';

  const delBtn = document.createElement('button');
  delBtn.className = 'item-delete';
  delBtn.title = 'Excluir caderno';
  delBtn.innerHTML = '✕';

  // excluir do item 
  delBtn.addEventListener('click', (ev) => {
    ev.stopPropagation();
    excluirCaderno(idx);
  });

  actions.appendChild(delBtn);

  item.appendChild(meta);
  item.appendChild(actions);

  // abrir ao clicar no item
  item.addEventListener('click', () => abrirCaderno(idx));

  return item;
}

function renderCadernos(filter = ''){
  listaCadernos.innerHTML = '';

  if(cadernos.length === 0){
    const p = document.createElement('div');
    p.className = 'caderno-empty';
    p.textContent = 'Nenhum caderno ainda. Clique em "Criar novo caderno".';
    listaCadernos.appendChild(p);
    return;
  }

  cadernos.forEach((cad, idx) => {
    if(filter && !(cad.nome.toLowerCase().includes(filter.toLowerCase()) || (cad.texto||'').toLowerCase().includes(filter.toLowerCase()))) return;
    const item = criarItemCadernoDOM(cad, idx);
    listaCadernos.appendChild(item);
  });
}

// criar novo (cada caderno é uma nota única)
novoBtn.addEventListener('click', () => {
  const nome = prompt('Nome do caderno:');
  if(!nome) return;
  // adiciona no topo
  cadernos.unshift({ nome: nome, texto: '' });
  salvarCadernos();
  renderCadernos();
  // abrir novo (índice 0)
  abrirCaderno(0);
});

// busca
if(buscarInput){
  buscarInput.addEventListener('input', (e) => {
    renderCadernos(e.target.value);
  });
}

function abrirCaderno(index){
  cadernoAtual = index;
  const cad = cadernos[index];
  tituloInput.value = cad ? cad.nome : '';
  textoCaderno.value = cad ? cad.texto : '';
  
  listaCadernos.classList.add('hidden');
  editor.classList.remove('hidden');
  setTimeout(()=> textoCaderno.focus(), 120);
}

// salvar enquanto digita (auto-save)
if(textoCaderno){
  textoCaderno.addEventListener('input', () => {
    if(cadernoAtual === null) return;
    cadernos[cadernoAtual].texto = textoCaderno.value;
    salvarCadernos();
    renderCadernos(buscarInput ? buscarInput.value : '');
  });
}
if(tituloInput){
  tituloInput.addEventListener('input', () => {
    if(cadernoAtual === null) return;
    cadernos[cadernoAtual].nome = tituloInput.value;
    salvarCadernos();
    renderCadernos(buscarInput ? buscarInput.value : '');
  });
}

// voltar para lista
if(voltarBtn){
  voltarBtn.addEventListener('click', () => {
    editor.classList.add('hidden');
    listaCadernos.classList.remove('hidden');
    cadernoAtual = null;
  });
}

// excluir caderno atual (botão do editor)
function excluirCaderno(index){
  if(index === null || index === undefined) return;
  if(!confirm('Excluir este caderno?')) return;

  // se o index é válido
  if(index >= 0 && index < cadernos.length){
    cadernos.splice(index, 1);
    salvarCadernos();

    // se deletamos o caderno que estava aberto (ou index < current), ajustar cadernoAtual
    if(cadernoAtual !== null){
      if(index === cadernoAtual){
        // fechamos editor e voltamos para a lista
        cadernoAtual = null;
        editor.classList.add('hidden');
        listaCadernos.classList.remove('hidden');
      } else if (index < cadernoAtual){
        // shift index
        cadernoAtual = cadernoAtual - 1;
      }
    }

    renderCadernos(buscarInput ? buscarInput.value : '');
    return;
  }
}

// botão excluir no editor (aplica ao cadernoAtual)
if(deletarBtn){
  deletarBtn.addEventListener('click', () => {
    if(cadernoAtual === null) return;
    excluirCaderno(cadernoAtual);
  });
}

renderCadernos();

// cronograma
(function () {
  // chave base para storage
  const STORAGE_KEY = "loopy_cronograma";

  // lê do localStorage (obj: { "Terça-feira 09": [ {text, done}, ... ], ...})
  function loadAll() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }
  function saveAll(obj) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  }

  // cria um <li> com checkbox, span e botão excluir
  function criarLi(tarefa) {
    const li = document.createElement("li");
    li.className = "tarefa-item";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "check-tarefa";
    checkbox.checked = !!tarefa.done;

    const span = document.createElement("span");
    span.textContent = tarefa.text;

    const del = document.createElement("button");
    del.className = "tarefa-del";
    del.type = "button";
    del.title = "Excluir";
    del.textContent = "✕";

    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(del);

    return li;
  }

  // retorna a "chave" do card (usar o texto do h3)
  function keyFromCard(card) {
    const h = card.querySelector("h3");
    return h ? h.textContent.trim() : null;
  }

  // renderiza todas as tarefas para um card a partir do storage
  function renderCard(card, all) {
    const key = keyFromCard(card);
    if (!key) return;
    const lista = card.querySelector(".lista-tarefas");
    lista.innerHTML = "";
    const arr = all[key] || [];
    arr.forEach(t => lista.appendChild(criarLi(t)));
  }

  // inicializa: carrega dados e conecta eventos (usa delegação)
  document.addEventListener("DOMContentLoaded", () => {
    const all = loadAll();

    // renderiza cada card existente
    document.querySelectorAll(".dia-card").forEach(card => renderCard(card, all));

    // clique no botão + (delegação)
    document.body.addEventListener("click", (ev) => {
      const botao = ev.target.closest(".add-tarefa");
      if (!botao) return;

      const card = botao.closest(".dia-card");
      if (!card) return;
      const input = card.querySelector(".input-tarefa");
      const lista = card.querySelector(".lista-tarefas");
      const key = keyFromCard(card);
      if (!input || !lista || !key) return;

      const texto = input.value.trim();
      if (!texto) return;

      // cria e adiciona no DOM
      const tarefaObj = { text: texto, done: false };
      lista.appendChild(criarLi(tarefaObj));

      // salva no storage
      all[key] = all[key] || [];
      all[key].push(tarefaObj);
      saveAll(all);

      input.value = "";
      input.focus();
    });

    // permitir Enter no input para adicionar (delegação de keydown)
    document.body.addEventListener("keydown", (ev) => {
      if (ev.key !== "Enter") return;
      const input = ev.target;
      if (!input.classList || !input.classList.contains("input-tarefa")) return;
      ev.preventDefault();
      const card = input.closest(".dia-card");
      const botao = card ? card.querySelector(".add-tarefa") : null;
      if (botao) botao.click();
    });

    // delegação: marcar/desmarcar checkbox e excluir tarefa
    document.body.addEventListener("click", (ev) => {
      // excluir
      const del = ev.target.closest(".tarefa-del");
      if (del) {
        const li = del.closest("li");
        const lista = li && li.closest(".lista-tarefas");
        const card = lista && lista.closest(".dia-card");
        const key = card && keyFromCard(card);
        if (li) li.remove();

        // remover do storage
        if (key && all[key]) {
          // identificar pelo texto (melhoraria com id, mas serve)
          const texto = li ? li.querySelector("span").textContent : null;
          if (texto) {
            all[key] = all[key].filter(t => t.text !== texto);
            saveAll(all);
          }
        }
        return;
      }

      // checkbox toggle
      const ck = ev.target.closest(".check-tarefa");
      if (ck) {
        const li = ck.closest("li");
        const lista = li && li.closest(".lista-tarefas");
        const card = lista && lista.closest(".dia-card");
        const key = card && keyFromCard(card);
        if (!key || !li) return;

        const texto = li.querySelector("span").textContent;
        if (!texto) return;

        // atualizar no storage (buscar por texto)
        if (!all[key]) all[key] = [];
        for (let t of all[key]) {
          if (t.text === texto) {
            t.done = !!ck.checked;
            break;
          }
        }
        saveAll(all);
      }
    });

  });
})();

// --- salvamento no localStorage ---
function salvarCronograma() {
    localStorage.setItem("cronograma", JSON.stringify(cronograma));
}

function carregarCronograma() {
    const salvo = localStorage.getItem("cronograma");
    return salvo ? JSON.parse(salvo) : {
        "Terça-feira 09": [],
        "Quarta-feira 10": [],
        "Quinta-feira 11": [],
        "Sexta-feira 12": []
    };
}

let cronograma = carregarCronograma();

// --- renderização dos dias ---
function renderizarCronograma() {
    Object.keys(cronograma).forEach(dia => {
        const container = document.querySelector(`[data-dia="${dia}"] .tarefas`);
        container.innerHTML = ""; 

        cronograma[dia].forEach((tarefa, index) => {
            const item = document.createElement("div");
            item.classList.add("tarefa-item");

            item.innerHTML = `
                <input type="checkbox" class="check" ${tarefa.feito ? "checked" : ""}>
                <span class="texto ${tarefa.feito ? "feito" : ""}">${tarefa.texto}</span>
            `;

            // marcar como concluída
            item.querySelector(".check").addEventListener("change", (e) => {
                cronograma[dia][index].feito = e.target.checked;
                salvarCronograma();
                renderizarCronograma();
            });

            container.appendChild(item);
        });
    });
}

// --- adicionar nova tarefa ---
document.querySelectorAll(".btn-add").forEach(botao => {
    botao.addEventListener("click", () => {
        const dia = botao.dataset.dia;
        const input = document.querySelector(`[data-dia="${dia}"] .input-tarefa`);
        const texto = input.value.trim();

        if (texto === "") return;

        cronograma[dia].push({ texto, feito: false });
        salvarCronograma();
        renderizarCronograma();

        input.value = "";
    });
});

// carregar ao abrir
renderizarCronograma();