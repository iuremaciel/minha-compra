import React, { useEffect, useRef, useState } from "react";
import "./styles.css";
import { createRoot } from "react-dom/client";

const STORAGE_KEY = "minha-compra-dados-v4";

const initialProducts = [
{ id: "arroz", name: "Arroz", price: 0, qty: 0, bought: false },
{ id: "feijao", name: "Feijão", price: 0, qty: 0, bought: false },
{ id: "leite", name: "Leite", price: 0, qty: 0, bought: false },
{ id: "cafe", name: "Café", price: 0, qty: 0, bought: false }
];

function readSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);

      const usedProductIds = new Set();
      const products = (Array.isArray(data.products) ? data.products : initialProducts)
        .map((product) => {
          let id = product.id;

          if (!id || usedProductIds.has(id)) {
            id = createId();
          }

          usedProductIds.add(id);

          return { ...product, id };
        });

      const usedHistoryIds = new Set();
      const history = (Array.isArray(data.history) ? data.history : [])
        .map((purchase) => {
          let id = purchase.id;

          if (!id || usedHistoryIds.has(id)) {
            id = createId();
          }

          usedHistoryIds.add(id);

          return { ...purchase, id };
        });

      return { products, history };
    }
  } catch (error) {
    console.error("Não foi possível carregar os dados:", error);
  }

  return {
    products: initialProducts,
    history: []
  };
}
return {
products: initialProducts,
history: []
};
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function money(value) {
return Number(value || 0).toLocaleString("pt-BR", {
style: "currency",
currency: "BRL"
});
}

function App() {
const [savedData] = useState(readSavedData);
const [products, setProducts] = useState(savedData.products || initialProducts);
const [history, setHistory] = useState(savedData.history || []);
const [tab, setTab] = useState("lista");
const [toast, setToast] = useState("");
const [confirmFinish, setConfirmFinish] = useState(false);
const [showAdd, setShowAdd] = useState(false);
const [newName, setNewName] = useState("");
const [newPrice, setNewPrice] = useState("");
const [newQty, setNewQty] = useState("1");
const [editing, setEditing] = useState(null);
const [editName, setEditName] = useState("");
const [editPrice, setEditPrice] = useState("");
const [details, setDetails] = useState(null);
const [deleteHistoryConfirm, setDeleteHistoryConfirm] = useState(null);

const touchStart = useRef({});
const touchCurrent = useRef({});
const toastTimer = useRef(null);

useEffect(() => {
try {
localStorage.setItem(
STORAGE_KEY,
JSON.stringify({ products, history })
);
} catch (error) {
console.error("Não foi possível salvar os dados:", error);
}
}, [products, history]);

useEffect(() => {
return () => {
if (toastTimer.current) clearTimeout(toastTimer.current);
};
}, []);

function showToast(message) {
setToast(message);
if (toastTimer.current) clearTimeout(toastTimer.current);
toastTimer.current = setTimeout(() => setToast(""), 2500);
}

const activeProducts = products.filter((product) => !product.bought);
const selectedProducts = products.filter(
(product) => Number(product.qty) > 0
);
const itemCount = selectedProducts.reduce(
(sum, product) => sum + Number(product.qty || 0),
0
);
const total = selectedProducts.reduce(
(sum, product) =>
sum + Number(product.price || 0) * Number(product.qty || 0),
0
);

function updateProduct(id, changes) {
setProducts((current) =>
current.map((product) =>
product.id === id && !product.bought
? { ...product, ...changes }
: product
)
);
}

function changeQty(product, amount) {
if (product.bought) return;

const nextQty = Math.max(0, Number(product.qty || 0) + amount);
updateProduct(product.id, { qty: nextQty });

}

function addProduct(event) {
event.preventDefault();

const name = newName.trim();
if (!name) {
  showToast("Digite o nome do produto");
  return;
}

const price = Math.max(0, Number(newPrice.replace(",", ".")) || 0);
const qty = Math.max(0, Number(newQty) || 0);

setProducts((current) => [
  ...current,
  {
    id: createId(),
    name,
    price,
    qty,
    bought: false
  }
]);

setNewName("");
setNewPrice("");
setNewQty("1");
setShowAdd(false);
showToast("Produto adicionado");

}

function openEdit(product) {
if (product.bought) return;
setEditing(product);
setEditName(product.name);
setEditPrice(String(product.price ?? 0).replace(".", ","));
}

function saveEdit(event) {
event.preventDefault();
if (!editing) return;

const name = editName.trim();
if (!name) {
  showToast("Digite o nome do produto");
  return;
}

const price = Math.max(
  0,
  Number(String(editPrice).replace(",", ".")) || 0
);

updateProduct(editing.id, { name, price });
setEditing(null);
showToast("Produto atualizado");

}

function deleteProduct(id) {
const product = products.find((item) => item.id === id);
if (!product || product.bought) return;

setProducts((current) => current.filter((item) => item.id !== id));
showToast("Produto excluído");

}

function toggleBought(product) {
if (product.bought) {
setProducts((current) =>
current.map((item) =>
item.id === product.id ? { ...item, bought: false } : item
)
);
showToast("Item desbloqueado");
} else {
setProducts((current) =>
current.map((item) =>
item.id === product.id ? { ...item, bought: true } : item
)
);
showToast("Item marcado como comprado e bloqueado");
}
}

function handleTouchStart(event, product) {
if (product.bought) return;

const touch = event.touches[0];
touchStart.current[product.id] = {
  x: touch.clientX,
  y: touch.clientY
};
touchCurrent.current[product.id] = 0;

}

function handleTouchMove(event, product) {
if (product.bought) return;

const start = touchStart.current[product.id];
if (!start) return;

const touch = event.touches[0];
const dx = touch.clientX - start.x;
const dy = touch.clientY - start.y;

if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
  touchCurrent.current[product.id] = dx;
  const card = event.currentTarget;
  card.style.transform = `translateX(${Math.max(-110, Math.min(110, dx))}px)`;
}

}

function handleTouchEnd(event, product) {
  if (product.bought) return;

  const dx = touchCurrent.current[product.id] || 0;
  const card = event.currentTarget;

  card.style.transform = "";

  delete touchStart.current[product.id];
  delete touchCurrent.current[product.id];

  if (dx < -65) {
    // Arrastar para a esquerda: excluir
    deleteProduct(product.id);
  } else if (dx > 65) {
    // Arrastar para a direita: editar
    openEdit(product);
  }
}

function finish() {
if (!selectedProducts.length) {
showToast("Adicione a quantidade de pelo menos um item");
return;
}

setConfirmFinish(true);

}

function confirmPurchase() {
const items = products
.filter((product) => Number(product.qty || 0) > 0)
.map((product) => ({
id: product.id,
name: product.name,
qty: Number(product.qty),
price: Number(product.price || 0),
subtotal: Number(product.qty) * Number(product.price || 0)
}));

if (!items.length) {
  setConfirmFinish(false);
  showToast("Adicione pelo menos um item");
  return;
}

const purchaseTotal = items.reduce(
  (sum, item) => sum + item.subtotal,
  0
);

const purchase = {
  id: createId(),
  date: new Date().toISOString(),
  items,
  total: purchaseTotal
};

setHistory((current) => [purchase, ...current]);

// Mantém os produtos cadastrados para a próxima compra,
// mas zera quantidades e desbloqueia todos os itens.
setProducts((current) =>
  current.map((product) => ({
    ...product,
    qty: 0,
    bought: false
  }))
);

setConfirmFinish(false);
setTab("historico");
showToast("Compra salva no histórico");

}

function deleteHistory(id) {
  setHistory((current) =>
    current.filter((purchase) => purchase.id !== id)
  );

  if (details?.id === id) {
    setDetails(null);
  }

  setDeleteHistoryConfirm(null);
  showToast("Registro excluído do histórico");
}

function clearHistory() {
setHistory([]);
setDeleteHistoryConfirm(null);
setDetails(null);
showToast("Histórico apagado");
}

function formatDate(date) {
try {
return new Date(date).toLocaleString("pt-BR", {
dateStyle: "short",
timeStyle: "short"
});
} catch {
return "";
}
}

return (
<div className="app-shell">
<header className="topbar">
<div className="brand">
<div className="brand-icon">🛒</div>
<div>
<h1>Minha Compra</h1>
<p>Organize sua lista e economize</p>
</div>
</div>
<div className="top-count">{itemCount} itens</div>
</header>

  <nav className="tabs">
    <button
      type="button"
      className={tab === "lista" ? "tab active" : "tab"}
      onClick={() => setTab("lista")}
    >
      <span>☑</span> Minha lista
    </button>
    <button
      type="button"
      className={tab === "historico" ? "tab active" : "tab"}
      onClick={() => setTab("historico")}
    >
      <span>◷</span> Histórico
      {history.length > 0 && <small>{history.length}</small>}
    </button>
  </nav>

  {tab === "lista" ? (
    <main className="main-content">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">SUA LISTA DE COMPRAS</p>
          <h2>Vamos às compras?</h2>
          <p className="muted">
            Marque os itens comprados para bloquear suas alterações.
          </p>
        </div>
        <button
          type="button"
          className="add-button"
          onClick={() => setShowAdd(true)}
          aria-label="Adicionar produto"
        >
          <span>＋</span> Adicionar
        </button>
      </section>

      <section className="gesture-hint">
       <span>← Arraste para excluir</span>
       <span>Arraste para editar →</span>
      </section>
     
      <section className="product-list">
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛍️</div>
            <h3>Sua lista está vazia</h3>
            <p>Adicione um produto para começar sua compra.</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowAdd(true)}
            >
              Adicionar primeiro produto
            </button>
          </div>
        ) : (
          products.map((product) => {
            const subtotal =
              Number(product.price || 0) * Number(product.qty || 0);

            return (
              <div
                className={`product-wrap ${product.bought ? "is-bought" : ""}`}
                key={product.id}
              >
                <div className="swipe-label swipe-edit">
                  <span>✎</span>
                  <small>Editar</small>
                </div>
                <div className="swipe-label swipe-delete">
                  <span>×</span>
                  <small>Excluir</small>
                </div>

                <article
                  className="product-card"
                  onTouchStart={(event) =>
                    handleTouchStart(event, product)
                  }
                  onTouchMove={(event) =>
                    handleTouchMove(event, product)
                  }
                  onTouchEnd={(event) =>
                    handleTouchEnd(event, product)
                  }
                >
                  <button
                    type="button"
                    className={`bought-toggle ${product.bought ? "checked" : ""}`}
                    onClick={() => toggleBought(product)}
                    aria-label={
                      product.bought
                        ? "Desbloquear item"
                        : "Marcar como comprado e bloquear"
                    }
                    title={
                      product.bought
                        ? "Toque para desbloquear"
                        : "Marcar como comprado e bloquear"
                    }
                  >
                    {product.bought ? "✓" : ""}
                  </button>

                  <div className="product-info">
                    <div className="product-title-line">
                      <h3>{product.name}</h3>
                      {product.bought && (
                        <span className="locked-badge">🔒 Bloqueado</span>
                      )}
                    </div>
                    <label className="price-field">
                      <span>Preço unitário</span>
                      <div className="price-input-wrap">
                        <span>R$</span>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={product.price}
                          disabled={product.bought}
                          onChange={(event) =>
                            updateProduct(product.id, {
                              price: Math.max(
                                0,
                                Number(event.target.value) || 0
                              )
                            })
                          }
                          aria-label={`Preço de ${product.name}`}
                        />
                      </div>
                    </label>
                  </div>

                  <div className="quantity-area">
                    <span className="quantity-label">Quantidade</span>
                    <div className="quantity-control">
                      <button
                        type="button"
                        disabled={product.bought || Number(product.qty) <= 0}
                        onClick={() => changeQty(product, -1)}
                        aria-label={`Diminuir quantidade de ${product.name}`}
                      >
                        −
                      </button>
                      <span>{product.qty}</span>
                      <button
                        type="button"
                        disabled={product.bought}
                        onClick={() => changeQty(product, 1)}
                        aria-label={`Aumentar quantidade de ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                    <strong className="subtotal">{money(subtotal)}</strong>
                  </div>
                </article>
              </div>
            );
          })
        )}
      </section>

      {products.length > 0 && (
        <p className="lock-note">
          🔒 Ao marcar o círculo de um produto, ele fica bloqueado.
          Toque novamente no círculo para desbloquear.
        </p>
      )}
    </main>
  ) : (
    <main className="main-content">
      <section className="welcome-row history-heading">
        <div>
          <p className="eyebrow">SUAS COMPRAS ANTERIORES</p>
          <h2>Histórico de compras</h2>
          <p className="muted">
            Consulte os valores e os produtos de cada compra.
          </p>
        </div>
        {history.length > 0 && (
          <button
            type="button"
            className="clear-history-button"
            onClick={() => setDeleteHistoryConfirm("all")}
          >
            Apagar tudo
          </button>
        )}
      </section>

      {history.length === 0 ? (
        <div className="empty-state history-empty">
          <div className="empty-icon">📋</div>
          <h3>Nenhuma compra salva</h3>
          <p>Quando finalizar uma compra, ela aparecerá aqui.</p>
          <button
            type="button"
            className="primary-button"
            onClick={() => setTab("lista")}
          >
            Voltar para a lista
          </button>
        </div>
      ) : (
        <section className="history-list">
          {history.map((purchase) => (
            <article className="history-card" key={purchase.id}>
              <button
                type="button"
                className="history-main"
                onClick={() => setDetails(purchase)}
              >
                <span className="history-icon">🛍️</span>
                <span className="history-description">
                  <strong>Compra realizada</strong>
                  <small>{formatDate(purchase.date)}</small>
                  <small>
                    {purchase.items.length} produtos diferentes
                  </small>
                </span>
                <span className="history-amount">
                  <strong>{money(purchase.total)}</strong>
                  <small>Ver detalhes ›</small>
                </span>
              </button>
              <button
                type="button"
                className="history-delete"
                onClick={() => setDeleteHistoryConfirm(purchase.id)}
                aria-label="Excluir esta compra do histórico"
                title="Excluir do histórico"
              >
                ×
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  )}

  {tab === "lista" && products.length > 0 && (
    <footer className="bottom-summary">
      <div className="summary-info">
        <span>Total estimado</span>
        <strong>{money(total)}</strong>
        <small>{itemCount} unidades na lista</small>
      </div>
      <button
        type="button"
        className="finish-button"
        onClick={finish}
      >
        Finalizar compra <span>→</span>
      </button>
    </footer>
  )}

  {showAdd && (
    <div className="modal-backdrop" onMouseDown={() => setShowAdd(false)}>
      <section
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">NOVA MERCADORIA</p>
            <h2>Adicionar produto</h2>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={() => setShowAdd(false)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <form onSubmit={addProduct}>
          <label className="form-label">
            Nome do produto
            <input
              autoFocus
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Ex.: Óleo, açúcar..."
              required
            />
          </label>
          <div className="form-grid">
            <label className="form-label">
              Preço unitário (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={newPrice}
                onChange={(event) => setNewPrice(event.target.value)}
                placeholder="0,00"
              />
            </label>
            <label className="form-label">
              Quantidade
              <input
                type="number"
                min="0"
                step="1"
                inputMode="numeric"
                value={newQty}
                onChange={(event) => setNewQty(event.target.value)}
                required
              />
            </label>
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowAdd(false)}
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Adicionar produto
            </button>
          </div>
        </form>
      </section>
    </div>
  )}

  {editing && (
    <div className="modal-backdrop" onMouseDown={() => setEditing(null)}>
      <section
        className="modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">EDITAR ITEM</p>
            <h2>Alterar produto</h2>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={() => setEditing(null)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <form onSubmit={saveEdit}>
          <label className="form-label">
            Nome do produto
            <input
              autoFocus
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
              required
            />
          </label>
          <label className="form-label">
            Preço unitário (R$)
            <input
              type="number"
              min="0"
              step="0.01"
              inputMode="decimal"
              value={editPrice}
              onChange={(event) => setEditPrice(event.target.value)}
            />
          </label>
          <div className="modal-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
            <button type="submit" className="primary-button">
              Salvar alterações
            </button>
          </div>
        </form>
      </section>
    </div>
  )}

  {confirmFinish && (
    <div
      className="modal-backdrop"
      onMouseDown={() => setConfirmFinish(false)}
    >
      <section
        className="modal confirm-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-symbol">🛒</div>
        <div className="modal-header centered-header">
          <div>
            <p className="eyebrow">CONFIRMAÇÃO</p>
            <h2>Finalizar compra?</h2>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={() => setConfirmFinish(false)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <p className="confirm-text">
          Deseja confirmar esta compra e salvar os produtos e o valor total
          no histórico? As quantidades serão zeradas para a próxima compra.
        </p>
        <div className="confirmation-total">
          <span>Total da compra</span>
          <strong>{money(total)}</strong>
        </div>
        <div className="confirm-items">
          <span>Unidades na compra</span>
          <strong>{itemCount}</strong>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setConfirmFinish(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={confirmPurchase}
          >
            ✓ Confirmar compra
          </button>
        </div>
      </section>
    </div>
  )}

  {details && (
    <div className="modal-backdrop" onMouseDown={() => setDetails(null)}>
      <section
        className="modal details-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <p className="eyebrow">DETALHES DA COMPRA</p>
            <h2>Resumo da compra</h2>
            <p className="muted">{formatDate(details.date)}</p>
          </div>
          <button
            type="button"
            className="close-button"
            onClick={() => setDetails(null)}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>
        <div className="detail-items">
          {details.items.map((item, index) => (
            <div className="detail-row" key={`${item.id || item.name}-${index}`}>
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.qty} × {money(item.price)}
                </small>
              </div>
              <strong>{money(item.subtotal ?? item.qty * item.price)}</strong>
            </div>
          ))}
        </div>
        <div className="detail-total">
          <span>Total pago</span>
          <strong>{money(details.total)}</strong>
        </div>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDetails(null)}
          >
            Fechar
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() => setDeleteHistoryConfirm(details.id)}
          >
            Excluir registro
          </button>
        </div>
      </section>
    </div>
  )}

  {deleteHistoryConfirm && (
    <div
      className="modal-backdrop"
      onMouseDown={() => setDeleteHistoryConfirm(null)}
    >
      <section
        className="modal small-modal"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="confirm-symbol danger-symbol">!</div>
        <h2>
          {deleteHistoryConfirm === "all"
            ? "Apagar todo o histórico?"
            : "Excluir esta compra?"}
        </h2>
        <p className="confirm-text">
          {deleteHistoryConfirm === "all"
            ? "Todos os registros de compras salvos serão apagados. Essa ação não pode ser desfeita."
            : "Este registro será removido do histórico. Essa ação não pode ser desfeita."}
        </p>
        <div className="modal-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setDeleteHistoryConfirm(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={() =>
              deleteHistoryConfirm === "all"
                ? clearHistory()
                : deleteHistory(deleteHistoryConfirm)
            }
          >
            Sim, excluir
          </button>
        </div>
      </section>
    </div>
  )}

  {toast && <div className="toast-message">{toast}</div>}
</div>

);
}

export default App;

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
