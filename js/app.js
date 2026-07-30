const STORAGE = "attentionTokens";

let data = {
    lastReset: "",
    people: []
};

let flippedCards = new Set();

let draggedCardId = null;

load();

function today() {
    return new Date().toISOString().substring(0, 10);
}

function updateLastResetLabel() {
    document.getElementById("lastResetLabel").textContent =
        data.lastReset || "-";
}

function load() {

    const saved = localStorage.getItem(STORAGE);

    if (saved) {
        data = JSON.parse(saved);
    }

    if (data.lastReset !== today()) {

        data.lastReset = today();

        data.people.forEach(p => p.used = 0);

        save();
    }

    render();
}

function save() {
    localStorage.setItem(STORAGE, JSON.stringify(data));
}

function addPerson() {

    const nome = document.getElementById("nome").value.trim();
    const limite = parseInt(document.getElementById("limite").value);

    if (!nome) return;

    data.people.push({
        id: crypto.randomUUID(),
        name: nome,
        limit: limite,
        used: 0,
        history: []
    });

    document.getElementById("nome").value = "";

    save();
    render();
}

function increase(id) {

    const p = data.people.find(x => x.id === id);

    if (p.used >= p.limit) {
        alert("⚠ " + p.name + " já utilizou todos os tokens hoje.");
        return;
    }

    const start = document.getElementById(`start-${id}`).value;
    const end = document.getElementById(`end-${id}`).value;
    const text = document.getElementById(`history-${id}`).value.trim();

    if (!start || !end || !text) {
        alert("Preencha horário inicial, final e descrição.");
        return;
    }

    p.used++;

    if (!p.history) {
        p.history = [];
    }

    p.history.push({
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString("pt-BR"),
        start,
        end,
        text
    });

    document.getElementById(`start-${id}`).value = "";
    document.getElementById(`end-${id}`).value = "";
    document.getElementById(`history-${id}`).value = "";

    save();
    render();
}

function decrease(id) {

    const p = data.people.find(x => x.id === id);

    if (p.used > 0) {
        p.used--;
    }

    save();
    render();
}

function removePerson(id) {

    if (!confirm("Remover pessoa?")) {
        return;
    }

    data.people = data.people.filter(x => x.id !== id);

    save();
    render();
}

function resetDay() {

    if (!confirm("Resetar todos os tokens?")) {
        return;
    }

    data.people.forEach(p => p.used = 0);

    data.lastReset = today();
    data.people.forEach(p => p.history = null);

    save();
    render();
}

function sortByUsage() {

    data.people.sort((a, b) => (b.used / b.limit) - (a.used / a.limit));

    save();
    render();
}

function editName(id, name) {

    const p = data.people.find(x => x.id === id);

    p.name = name.trim();

    save();
}

function editLimit(id, value) {

    const p = data.people.find(x => x.id === id);

    p.limit = parseInt(value);

    if (p.used > p.limit) {
        p.used = p.limit;
    }

    save();
    render();
}

function flipCard(id) {
    debugger

    const card = document.getElementById("card-" + id);

    card.classList.toggle("flipped");

    if (card.classList.contains("flipped")) {
        flippedCards.add(String(id));
    } else {
        flippedCards.delete(String(id));
    }
}

function calculateDuration(start, end) {

    if (!start || !end) {
        return "-";
    }

    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);

    const startMinutes = sh * 60 + sm;
    const endMinutes = eh * 60 + em;

    const diff = endMinutes - startMinutes;

    if (diff <= 0) {
        return "-";
    }

    const h = Math.floor(diff / 60);
    const m = diff % 60;

    return `${h}h ${m}min`;
}

function render() {

    const filtro = document.getElementById("search").value.toLowerCase();

    const list = document.getElementById("list");

    list.innerHTML = "";

    data.people
        .filter(p => p.name.toLowerCase().includes(filtro))
        .forEach(p => {

            const percent = Math.round((p.used / p.limit) * 100);

            let color = "#27ae60";

            if (percent >= 70) color = "#f1c40f";
            if (percent >= 90) color = "#e74c3c";

            const card = document.createElement("div");

            card.className = "card";
            card.id = `card-${p.id}`;
            card.draggable = true;

            card.ondragstart = () => {
    draggedCardId = p.id;
    card.classList.add("dragging");
};

card.ondragend = () => {
    draggedCardId = null;
    card.classList.remove("dragging");
};

card.ondragover = (e) => {
    e.preventDefault();
};

card.ondrop = (e) => {

    e.preventDefault();

    if (!draggedCardId || draggedCardId === p.id) {
        return;
    }

    const fromIndex = data.people.findIndex(
        x => x.id === draggedCardId
    );

    const toIndex = data.people.findIndex(
        x => x.id === p.id
    );


    const [removed] = data.people.splice(fromIndex, 1);

    data.people.splice(toIndex, 0, removed);


    save();
    render();
};

            card.innerHTML = `

<div class="card-inner">

    <div class="card-front">

        <div class="personHeader">

            <div>

                <h2 class="editable"
                    contenteditable="true"
                    onblur="editName('${p.id}', this.innerText)">
                    ${p.name}
                </h2>

                <div class="small">

                    <input
                        type="number"
                        value="${p.limit}"
                        min="1"
                        onchange="editLimit('${p.id}', this.value)"
                        onclick="event.stopPropagation()">

                    tokens por dia

                </div>

            </div>

            <button
                class="primary"
                onclick="event.stopPropagation(); flipCard('${p.id}')">

                📖

            </button>

        </div>

        <div class="progress">

            <div class="progress-bar"
                 style="width:${percent}%;background:${color};">

            </div>

        </div>

        <div>

            <strong>${p.used}</strong> / ${p.limit}

            ${p.used >= p.limit
                    ? '<span class="warning"> ⚠ Limite atingido</span>'
                    : ''
                }

        </div>

        <div class="time-row">

            <div class="form-group">

                <label>Início</label>

                <input
                    id="start-${p.id}"
                    type="time">

            </div>

            <div class="form-group">

                <label>Fim</label>

                <input
                    id="end-${p.id}"
                    type="time">

            </div>

        </div>

        <div class="form-group">

            <label>Descrição</label>

            <textarea
                id="history-${p.id}"
                placeholder="Descreva o atendimento..."></textarea>

        </div>

        <div class="buttons">

            <button
                onclick="event.stopPropagation();decrease('${p.id}')">

                -

            </button>

            <button
                class="primary"
                onclick="event.stopPropagation();increase('${p.id}')">

                Registrar

            </button>

            <button
                class="danger"
                onclick="event.stopPropagation();removePerson('${p.id}')">

                🗑

            </button>

        </div>

    </div>

    <div class="card-back">

        <div class="history-title">

            <h3>Histórico</h3>

            <button
                class="primary"
                onclick="event.stopPropagation();flipCard('${p.id}')">

                ↩ Voltar

            </button>

        </div>

        ${!p.history || p.history.length === 0

                    ? "<p class='small'>Nenhum atendimento registrado.</p>"

                    : p.history
                        .slice()
                        .reverse()
                        .map(h => `

<div class="history-item">

    <div class="history-date">
        ${h.date}
    </div>


    ${h.start && h.end
                                ?
                                `
        <div class="history-hours">
            🕐 ${h.start} às ${h.end}
            • ${calculateDuration(h.start, h.end)}
        </div>
        `
                                :
                                ""
                            }


    <div class="history-description">
        ${h.text}
    </div>


    <div class="history-actions">

        <button
            class="primary"
            onclick="event.stopPropagation();editHistory('${p.id}', '${h.id}')">

            ✏️ Editar

        </button>


        <button
            class="danger"
            onclick="event.stopPropagation();removeHistory('${p.id}', '${h.id}')">

            🗑 Excluir

        </button>

    </div>


</div>

`).join("")
                }

    </div>

</div>
`;

            list.appendChild(card);

            updateLastResetLabel();
            if (flippedCards.has(String(p.id))) {
                card.classList.add("flipped");
            }
        });

}

function editHistory(personId, historyId) {

    const p = data.people.find(x => x.id === personId);

    const h = p.history.find(x => x.id === historyId);

    if (!h) return;

    const text = prompt("Editar descrição:", h.text);

    if (text !== null && text.trim()) {
        h.text = text.trim();
    }

    save();
    render();
}


function removeHistory(personId, historyId) {

    if (!confirm("Excluir este item do histórico?")) {
        return;
    }

    const p = data.people.find(
        x => String(x.id) === String(personId)
    );

    if (!p) return;

    p.history = p.history.filter(
        h => String(h.id) !== String(historyId)
    );

    flippedCards.add(String(personId));
    p.used--;
    save();
    render();
}