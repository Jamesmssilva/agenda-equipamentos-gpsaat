const equipmentCatalog = [
  {
    id: "microondas-anton-paar",
    name: "Microondas Anton Paar",
    category: "Preparo de amostras",
    location: "Laboratório GPSAAT",
    icon: "MW",
    description: "Sistema de digestão por micro-ondas para preparo analítico de amostras."
  },
  {
    id: "gfaas",
    name: "Espectrômetro de forno de grafite (GFAAS)",
    category: "Absorção atômica",
    location: "Laboratório GPSAAT",
    icon: "GF",
    description: "Equipamento para determinações por absorção atômica com atomização em forno de grafite."
  },
  {
    id: "faas",
    name: "Espectrômetro de absorção atômica por atomização eletrotérmica (FAAS)",
    category: "Absorção atômica",
    location: "Laboratório GPSAAT",
    icon: "FA",
    description: "Equipamento para análises por absorção atômica em rotina analítica do grupo."
  },
  {
    id: "phmetro",
    name: "pHmetro",
    category: "Uso restrito",
    location: "Laboratório GPSAAT",
    icon: "PH",
    description: "Uso somente para alunos do grupo GPSAAT."
  }
];

const storageKey = "ufcat-equipment-bookings-v2";
const legacyStorageKey = "ufcat-equipment-bookings-v1";
const localAdminPassword = "ntj2ax4U86@@##";
const supabaseConfig = window.GPSAAT_SUPABASE || {};
const hasSupabase = Boolean(supabaseConfig.url && supabaseConfig.anonKey && window.supabase);
const supabaseClient = hasSupabase
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

const equipmentMigration = {
  "projetor-epson": "microondas-anton-paar",
  "notebook-dell": "microondas-anton-paar",
  "camera-sony": "gfaas",
  "microfone-rode": "phmetro",
  "kit-transmissao": "faas",
  "microscopio": "phmetro"
};

const seedBookings = [
  {
    id: crypto.randomUUID(),
    applicantName: "Ana Luiza Pereira",
    advisorName: "Profa. Mariana Alves",
    email: "ana.pereira@ufcat.edu.br",
    department: "Engenharia Civil",
    equipmentId: "microondas-anton-paar",
    date: getDateOffset(0),
    startTime: "09:00",
    endTime: "11:00",
    purpose: "Aula prática de materiais.",
    status: "approved",
    decisionNote: ""
  },
  {
    id: crypto.randomUUID(),
    applicantName: "Marcos Vinícius Rocha",
    advisorName: "Prof. Eduardo Ramos",
    email: "marcos.rocha@ufcat.edu.br",
    department: "Projeto de Extensão",
    equipmentId: "gfaas",
    date: getDateOffset(2),
    startTime: "14:00",
    endTime: "17:30",
    purpose: "Registro de atividade experimental.",
    status: "pending",
    decisionNote: ""
  },
  {
    id: crypto.randomUUID(),
    applicantName: "Carla Mendes",
    advisorName: "Profa. Renata Castro",
    email: "carla.mendes@ufcat.edu.br",
    department: "PROEC",
    equipmentId: "faas",
    date: getDateOffset(5),
    startTime: "18:00",
    endTime: "21:00",
    purpose: "Análise de amostras de projeto.",
    status: "approved",
    decisionNote: ""
  }
];

const state = {
  bookings: [],
  isAdmin: false,
  loading: true
};

const elements = {
  form: document.querySelector("#bookingForm"),
  equipment: document.querySelector("#equipment"),
  filterEquipment: document.querySelector("#filterEquipment"),
  filterStatus: document.querySelector("#filterStatus"),
  filterDate: document.querySelector("#filterDate"),
  search: document.querySelector("#search"),
  scheduleList: document.querySelector("#scheduleList"),
  equipmentGrid: document.querySelector("#equipmentGrid"),
  availabilityMessage: document.querySelector("#availabilityMessage"),
  todayCount: document.querySelector("#todayCount"),
  weekCount: document.querySelector("#weekCount"),
  pendingCount: document.querySelector("#pendingCount"),
  exportCsv: document.querySelector("#exportCsv"),
  adminLogin: document.querySelector("#adminLogin"),
  adminEmail: document.querySelector("#adminEmail"),
  adminPassword: document.querySelector("#adminPassword"),
  adminLogout: document.querySelector("#adminLogout"),
  adminBoard: document.querySelector("#adminBoard"),
  adminList: document.querySelector("#adminList"),
  adminPendingCount: document.querySelector("#adminPendingCount"),
  adminApprovedCount: document.querySelector("#adminApprovedCount"),
  adminRejectedCount: document.querySelector("#adminRejectedCount"),
  toast: document.querySelector("#toast")
};

function getDateOffset(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().slice(0, 10);
}

function normalizeBooking(booking) {
  return {
    id: booking.id || crypto.randomUUID(),
    applicantName: booking.applicantName || booking.applicant_name || booking.personName || "",
    advisorName: booking.advisorName || booking.advisor_name || "",
    email: booking.email || "",
    department: booking.department || "",
    equipmentId: equipmentMigration[booking.equipmentId] || booking.equipmentId || booking.equipment_id || equipmentCatalog[0].id,
    date: booking.date || booking.booking_date || getDateOffset(0),
    startTime: String(booking.startTime || booking.start_time || "08:00").slice(0, 5),
    endTime: String(booking.endTime || booking.end_time || "09:00").slice(0, 5),
    purpose: booking.purpose || "",
    status: booking.status || "pending",
    decisionNote: booking.decisionNote || booking.decision_note || ""
  };
}

function toDatabaseRow(booking) {
  return {
    applicant_name: booking.applicantName,
    advisor_name: booking.advisorName,
    email: booking.email,
    department: booking.department,
    equipment_id: booking.equipmentId,
    booking_date: booking.date,
    start_time: booking.startTime,
    end_time: booking.endTime,
    purpose: booking.purpose,
    status: booking.status,
    decision_note: booking.decisionNote || ""
  };
}

function loadLocalBookings() {
  const stored = localStorage.getItem(storageKey);
  const legacy = localStorage.getItem(legacyStorageKey);
  const source = stored || legacy;

  if (!source) {
    localStorage.setItem(storageKey, JSON.stringify(seedBookings));
    return seedBookings.map(normalizeBooking);
  }

  try {
    const normalized = JSON.parse(source).map(normalizeBooking);
    localStorage.setItem(storageKey, JSON.stringify(normalized));
    return normalized;
  } catch {
    localStorage.setItem(storageKey, JSON.stringify(seedBookings));
    return seedBookings.map(normalizeBooking);
  }
}

function saveLocalBookings() {
  localStorage.setItem(storageKey, JSON.stringify(state.bookings));
}

async function refreshSession() {
  if (!hasSupabase) {
    state.isAdmin = sessionStorage.getItem("gpsaat-admin") === "true";
    elements.adminEmail.required = false;
    elements.adminEmail.parentElement.hidden = true;
    return;
  }

  elements.adminEmail.required = true;
  elements.adminEmail.parentElement.hidden = false;

  const { data } = await supabaseClient.auth.getSession();
  state.isAdmin = Boolean(data.session);
}

async function loadBookings() {
  if (!hasSupabase) {
    state.bookings = loadLocalBookings();
    return;
  }

  const { data, error } = await supabaseClient
    .from("equipment_bookings")
    .select("*")
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    state.bookings = [];
    showToast(`Erro ao carregar Supabase: ${error.message}`);
    return;
  }

  state.bookings = data.map(normalizeBooking);
}

function minutes(time) {
  const [hours, mins] = time.split(":").map(Number);
  return hours * 60 + mins;
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function getEquipmentName(id) {
  return equipmentCatalog.find((item) => item.id === id)?.name ?? "Equipamento";
}

function getStatusLabel(status) {
  const labels = {
    pending: "Pendente",
    approved: "Aprovada",
    rejected: "Reprovada"
  };
  return labels[status] || "Pendente";
}

function hasConflict(candidate) {
  const candidateStart = minutes(candidate.startTime);
  const candidateEnd = minutes(candidate.endTime);

  return state.bookings.some((booking) => {
    if (booking.id === candidate.id) return false;
    if (booking.status === "rejected") return false;
    if (booking.equipmentId !== candidate.equipmentId || booking.date !== candidate.date) return false;

    const bookingStart = minutes(booking.startTime);
    const bookingEnd = minutes(booking.endTime);
    return candidateStart < bookingEnd && candidateEnd > bookingStart;
  });
}

function validateTime(startTime, endTime) {
  if (!startTime || !endTime) return false;
  return minutes(startTime) < minutes(endTime);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function populateSelects() {
  elements.equipment.innerHTML = equipmentCatalog
    .map((item) => `<option value="${item.id}">${item.name}</option>`)
    .join("");

  elements.filterEquipment.innerHTML = [
    '<option value="all">Todos</option>',
    ...equipmentCatalog.map((item) => `<option value="${item.id}">${item.name}</option>`)
  ].join("");
}

function renderEquipment() {
  const today = getDateOffset(0);

  elements.equipmentGrid.innerHTML = equipmentCatalog.map((item) => {
    const todayBookings = state.bookings.filter((booking) => (
      booking.equipmentId === item.id &&
      booking.date === today &&
      booking.status === "approved"
    )).length;
    const statusText = todayBookings ? `${todayBookings} aprovada(s) hoje` : "Livre hoje";

    return `
      <article class="equipment-card">
        <div class="status-row">
          <span class="equipment-icon" aria-hidden="true">${item.icon}</span>
          <span class="status">${statusText}</span>
        </div>
        <div>
          <h3>${item.name}</h3>
          <p>${item.description}</p>
        </div>
        <span class="chip">${item.category} · ${item.location}</span>
      </article>
    `;
  }).join("");
}

function getFilteredBookings() {
  const selectedEquipment = elements.filterEquipment.value;
  const selectedStatus = elements.filterStatus.value;
  const selectedDate = elements.filterDate.value;
  const searchTerm = elements.search.value.trim().toLowerCase();

  return state.bookings
    .filter((booking) => selectedEquipment === "all" || booking.equipmentId === selectedEquipment)
    .filter((booking) => !selectedDate || booking.date === selectedDate)
    .filter((booking) => {
      if (selectedStatus === "all") return true;
      if (selectedStatus === "active") return booking.status !== "rejected";
      return booking.status === selectedStatus;
    })
    .filter((booking) => {
      if (!searchTerm) return true;
      const searchable = [
        booking.applicantName,
        booking.advisorName,
        booking.email,
        booking.department,
        booking.purpose,
        getEquipmentName(booking.equipmentId),
        getStatusLabel(booking.status)
      ].join(" ").toLowerCase();
      return searchable.includes(searchTerm);
    })
    .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
}

function renderBookings() {
  const bookings = getFilteredBookings();

  if (state.loading) {
    elements.scheduleList.innerHTML = '<div class="empty-state">Carregando agenda...</div>';
    return;
  }

  if (!bookings.length) {
    elements.scheduleList.innerHTML = '<div class="empty-state">Nenhuma solicitação encontrada para os filtros selecionados.</div>';
    return;
  }

  elements.scheduleList.innerHTML = bookings.map((booking) => `
    <article class="booking-card status-${booking.status}">
      <div>
        <div class="booking-card-top">
          <span class="chip">${formatDate(booking.date)} · ${booking.startTime} às ${booking.endTime}</span>
          <span class="status-badge ${booking.status}">${getStatusLabel(booking.status)}</span>
        </div>
        <h3>${getEquipmentName(booking.equipmentId)}</h3>
        <p>${escapeHtml(booking.purpose)}</p>
        <ul class="booking-meta">
          <li>Solicitante: ${escapeHtml(booking.applicantName)}</li>
          <li>Orientador: ${escapeHtml(booking.advisorName || "Não informado")}</li>
          <li>${escapeHtml(booking.department)}</li>
          <li>${escapeHtml(booking.email)}</li>
        </ul>
      </div>
    </article>
  `).join("");
}

function renderMetrics() {
  const today = getDateOffset(0);
  const weekLimit = getDateOffset(7);
  const approved = state.bookings.filter((booking) => booking.status === "approved");

  elements.todayCount.textContent = approved.filter((booking) => booking.date === today).length;
  elements.weekCount.textContent = approved.filter((booking) => booking.date >= today && booking.date <= weekLimit).length;
  elements.pendingCount.textContent = state.bookings.filter((booking) => booking.status === "pending").length;
}

function renderAdmin() {
  elements.adminLogin.hidden = state.isAdmin;
  elements.adminBoard.hidden = !state.isAdmin;
  elements.adminLogout.hidden = !state.isAdmin;

  elements.adminPendingCount.textContent = state.bookings.filter((booking) => booking.status === "pending").length;
  elements.adminApprovedCount.textContent = state.bookings.filter((booking) => booking.status === "approved").length;
  elements.adminRejectedCount.textContent = state.bookings.filter((booking) => booking.status === "rejected").length;

  if (!state.isAdmin) return;

  const ordered = [...state.bookings].sort((a, b) => {
    const statusOrder = { pending: 0, approved: 1, rejected: 2 };
    return statusOrder[a.status] - statusOrder[b.status] || `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`);
  });

  if (!ordered.length) {
    elements.adminList.innerHTML = '<div class="empty-state">Nenhuma solicitação cadastrada.</div>';
    return;
  }

  elements.adminList.innerHTML = ordered.map((booking) => `
    <form class="admin-card status-${booking.status}" data-admin-card="${booking.id}">
      <div class="admin-card-head">
        <div>
          <span class="status-badge ${booking.status}">${getStatusLabel(booking.status)}</span>
          <h3>${getEquipmentName(booking.equipmentId)}</h3>
        </div>
        <div class="admin-actions">
          <button class="button approve" type="button" data-action="approve">Aprovar</button>
          <button class="button danger" type="button" data-action="reject">Reprovar</button>
        </div>
      </div>

      <div class="admin-edit-grid">
        <label>
          Solicitante
          <input name="applicantName" value="${escapeHtml(booking.applicantName)}" required>
        </label>
        <label>
          Orientador
          <input name="advisorName" value="${escapeHtml(booking.advisorName)}" required>
        </label>
        <label>
          E-mail
          <input name="email" type="email" value="${escapeHtml(booking.email)}" required>
        </label>
        <label>
          Setor ou projeto
          <input name="department" value="${escapeHtml(booking.department)}" required>
        </label>
        <label>
          Equipamento
          <select name="equipmentId" required>
            ${equipmentCatalog.map((item) => `<option value="${item.id}" ${item.id === booking.equipmentId ? "selected" : ""}>${item.name}</option>`).join("")}
          </select>
        </label>
        <label>
          Data
          <input name="date" type="date" value="${booking.date}" required>
        </label>
        <label>
          Início
          <input name="startTime" type="time" value="${booking.startTime}" required>
        </label>
        <label>
          Fim
          <input name="endTime" type="time" value="${booking.endTime}" required>
        </label>
        <label class="wide-field">
          Finalidade
          <textarea name="purpose" rows="3" required>${escapeHtml(booking.purpose)}</textarea>
        </label>
        <label class="wide-field">
          Observação da decisão
          <input name="decisionNote" value="${escapeHtml(booking.decisionNote)}" placeholder="Opcional">
        </label>
      </div>

      <button class="button secondary" type="submit">Salvar edição</button>
    </form>
  `).join("");
}

function renderAll() {
  renderBookings();
  renderEquipment();
  renderMetrics();
  renderAdmin();
  updateAvailabilityMessage();
}

function getFormCandidate() {
  const formData = new FormData(elements.form);
  return {
    id: crypto.randomUUID(),
    applicantName: formData.get("applicantName").trim(),
    advisorName: formData.get("advisorName").trim(),
    email: formData.get("email").trim(),
    department: formData.get("department").trim(),
    equipmentId: formData.get("equipment"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose").trim(),
    status: "pending",
    decisionNote: ""
  };
}

function getAdminCandidate(form, existing) {
  const formData = new FormData(form);
  return {
    ...existing,
    applicantName: formData.get("applicantName").trim(),
    advisorName: formData.get("advisorName").trim(),
    email: formData.get("email").trim(),
    department: formData.get("department").trim(),
    equipmentId: formData.get("equipmentId"),
    date: formData.get("date"),
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
    purpose: formData.get("purpose").trim(),
    decisionNote: formData.get("decisionNote").trim()
  };
}

function updateAvailabilityMessage() {
  const candidate = getFormCandidate();
  elements.availabilityMessage.className = "availability";

  if (!candidate.date || !candidate.startTime || !candidate.endTime) {
    elements.availabilityMessage.textContent = "Escolha equipamento, data e horário.";
    return;
  }

  if (!validateTime(candidate.startTime, candidate.endTime)) {
    elements.availabilityMessage.classList.add("error");
    elements.availabilityMessage.textContent = "O horário final precisa ser depois do horário inicial.";
    return;
  }

  if (hasConflict(candidate)) {
    elements.availabilityMessage.classList.add("error");
    elements.availabilityMessage.textContent = "Já existe solicitação ou reserva para esse equipamento nesse horário.";
    return;
  }

  elements.availabilityMessage.classList.add("ok");
  elements.availabilityMessage.textContent = "Horário disponível para solicitação.";
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 3200);
}

function exportCsv() {
  const rows = [
    ["Equipamento", "Data", "Inicio", "Fim", "Status", "Solicitante", "Orientador", "Email", "Setor", "Finalidade", "Observacao"],
    ...getFilteredBookings().map((booking) => [
      getEquipmentName(booking.equipmentId),
      booking.date,
      booking.startTime,
      booking.endTime,
      getStatusLabel(booking.status),
      booking.applicantName,
      booking.advisorName,
      booking.email,
      booking.department,
      booking.purpose,
      booking.decisionNote
    ])
  ];

  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "agenda-equipamentos-gpsaat.csv";
  link.click();
  URL.revokeObjectURL(url);
}

async function createBooking(booking) {
  if (!hasSupabase) {
    state.bookings.push(booking);
    saveLocalBookings();
    return { error: null };
  }

  const { error } = await supabaseClient
    .from("equipment_bookings")
    .insert(toDatabaseRow(booking));

  if (!error) await loadBookings();
  return { error };
}

async function saveBooking(booking) {
  if (!hasSupabase) {
    const index = state.bookings.findIndex((item) => item.id === booking.id);
    if (index >= 0) state.bookings[index] = booking;
    saveLocalBookings();
    return { error: null };
  }

  const { error } = await supabaseClient
    .from("equipment_bookings")
    .update(toDatabaseRow(booking))
    .eq("id", booking.id);

  if (!error) await loadBookings();
  return { error };
}

async function updateBookingStatus(id, status) {
  const booking = state.bookings.find((item) => item.id === id);
  if (!booking) return;

  const candidate = { ...booking, status };
  if (status === "approved" && !validateTime(candidate.startTime, candidate.endTime)) {
    showToast("Corrija o horário antes de aprovar.");
    return;
  }

  if (status === "approved" && hasConflict(candidate)) {
    showToast("Não foi possível aprovar: existe conflito de horário.");
    return;
  }

  const { error } = await saveBooking(candidate);
  if (error) {
    showToast(`Erro ao salvar: ${error.message}`);
    return;
  }

  renderAll();
  showToast(status === "approved" ? "Solicitação aprovada." : "Solicitação reprovada.");
}

elements.form.addEventListener("input", updateAvailabilityMessage);
elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const candidate = getFormCandidate();

  if (!validateTime(candidate.startTime, candidate.endTime)) {
    showToast("Corrija o intervalo de horário antes de enviar.");
    updateAvailabilityMessage();
    return;
  }

  if (hasConflict(candidate)) {
    showToast("Esse equipamento já tem solicitação ou reserva no horário escolhido.");
    updateAvailabilityMessage();
    return;
  }

  const { error } = await createBooking(candidate);
  if (error) {
    showToast(`Erro ao enviar solicitação: ${error.message}`);
    return;
  }

  elements.form.reset();
  document.querySelector("#date").value = getDateOffset(0);
  await loadBookings();
  renderAll();
  showToast("Solicitação enviada para aprovação.");
});

elements.adminLogin.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!hasSupabase) {
    if (elements.adminPassword.value !== localAdminPassword) {
      showToast("Senha de administrador inválida.");
      return;
    }

    state.isAdmin = true;
    sessionStorage.setItem("gpsaat-admin", "true");
    elements.adminPassword.value = "";
    renderAdmin();
    showToast("Área administrativa liberada em modo local.");
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: elements.adminEmail.value.trim(),
    password: elements.adminPassword.value
  });

  if (error) {
    showToast(`Login não autorizado: ${error.message}`);
    return;
  }

  await refreshSession();
  await loadBookings();
  elements.adminPassword.value = "";
  renderAll();
  showToast("Área administrativa liberada.");
});

elements.adminLogout.addEventListener("click", async () => {
  if (hasSupabase) {
    await supabaseClient.auth.signOut();
  } else {
    sessionStorage.removeItem("gpsaat-admin");
  }

  state.isAdmin = false;
  await loadBookings();
  renderAll();
  showToast("Sessão administrativa encerrada.");
});

elements.adminList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;

  const card = button.closest("[data-admin-card]");
  updateBookingStatus(card.dataset.adminCard, button.dataset.action === "approve" ? "approved" : "rejected");
});

elements.adminList.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target.closest("[data-admin-card]");
  const booking = state.bookings.find((item) => item.id === form.dataset.adminCard);
  if (!booking) return;

  const candidate = getAdminCandidate(form, booking);
  if (!validateTime(candidate.startTime, candidate.endTime)) {
    showToast("O horário final precisa ser depois do inicial.");
    return;
  }

  if (candidate.status !== "rejected" && hasConflict(candidate)) {
    showToast("Não foi possível salvar: existe conflito de horário.");
    return;
  }

  const { error } = await saveBooking(candidate);
  if (error) {
    showToast(`Erro ao salvar: ${error.message}`);
    return;
  }

  renderAll();
  showToast("Solicitação editada.");
});

[elements.filterDate, elements.filterEquipment, elements.filterStatus, elements.search].forEach((element) => {
  element.addEventListener("input", renderBookings);
});

elements.exportCsv.addEventListener("click", exportCsv);

async function init() {
  populateSelects();
  document.querySelector("#date").value = getDateOffset(0);
  renderAll();

  await refreshSession();
  await loadBookings();
  state.loading = false;
  renderAll();

  if (!hasSupabase) {
    showToast("Modo local ativo. Configure o Supabase para salvar os dados online.");
  }
}

init();
