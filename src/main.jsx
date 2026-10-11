
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

const STORAGE_KEY = "minha-compra-dados-v4";

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function money(value) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function readSavedData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (saved) {
      const data = JSON.parse(saved);
      const usedProductIds = new Set();
      const usedHistoryIds = new Set();

      const products = (
        Array.isArray(data.products) ? data.products : []
      ).map((product) => {
        let id = product.id;

        if (!id || usedProductIds.has(id)) {
          id = createId();
        }

        usedProductIds.add(id);

        return {
          ...product,
          id,
          name: product.name || "",
          price: Number(product.price || 0),
          quantity: Math.max(1, Number(product.quantity || 1)),
          bought: Boolean(product.bought),
        };
      });

      const history = (
        Array.isArray(data.history) ? data.history : []
      ).map((purchase) => {
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
    console.error("Erro ao carregar os dados:", error);
  }

  return { products: [], history: [] };
}

function App() {
  const [initialData] = useState(() => readSavedData());

  const [products, setProducts] = useState(initialData.products);
  const [history, setHistory] = useState(initialData.history);
  const [tab, setTab] = useState("lista");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [editingId, setEditingId] = useState(null);

  const [confirmFinish, setConfirmFinish] = useState(false);
  const [deleteHistoryConfirm, setDeleteHistoryConfirm] = useState(null);
  const [details, setDetails] = useState(null);
  const [toast, setToast] = useState("");

  const touchStart = useRef({});
  const touchCurrent = useRef({});

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ products, history })
      );
    } catch (error) {
      console.error("Erro ao salvar os dados:", error);
    }
  }, [products, history]);

  const total = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + Number(product.price || 0) * Number(product.quantity || 1),
        0
      ),
    [products]
  );

  const boughtCount = products.filter((product) => product.bought).length;

  function showToast(message) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2500);
  }

  function resetForm() {
    setName("");
    setPrice("");
    setQuantity("1");
    setEditingId(null);
  }

  function saveProduct(event) {
    event.preventDefault();

    const cleanName = name.trim();
    if (!cleanName) {
      showToast("Digite o nome do produto.");
      return;
    }

    const parsedPrice = Number(String(price).replace(",", "."));
    const parsedQuantity = Math.floor(Number(quantity));

    if (price.trim() !== "" && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) {
      showToast("Digite um preço válido.");
      return;
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      showToast("A quantidade deve ser pelo menos 1.");
      return;
    }

    if (editingId) {
      setProducts((current) =>
        current.map((product) =>
          product.id === editingId
            ? {
                ...product,
                name: cleanName,
                price: parsedPrice || 0,
                quantity: parsedQuantity,
              }
            : product
        )
      );
      showToast("Produto atualizado!");
    } else {
      setProducts((current) => [
        ...current,
        {
          id: createId(),
          name: cleanName,
          price: parsedPrice || 0,
          quantity: parsedQuantity,
          bought: false,
        },
      ]);
      showToast("Produto adicionado!");
    }

    resetForm();
  }

  function openEdit(product) {
    if (product.bought) {
      showToast("Desmarque o produto para editá-lo.");
      return;
    }

    setEditingId(product.id);
    setName(product.name);
    setPrice(String(product.price ?? ""));
    setQuantity(String(product.quantity || 1));

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function deleteProduct(id) {
    setProducts((current) => current.filter((product) => product.id !== id));

    if (editingId === id) resetForm();

    showToast("Produto excluído.");
  }

  function toggleBought(id) {
    setProducts((current) =>
      current.map((product) =>
        product.id === id
          ? { ...product, bought: !product.bought }
          : product
      )
    );
  }

  function changeQuantity(id, amount) {
    setProducts((current) =>
      current.map((product) => {
        if (product.id !== id || product.bought) return product;

        return {
          ...product,
          quantity: Math.max(1, Number(product.quantity || 1) + amount),
        };
      })
    );
  }

  function changePrice(id, value) {
    const parsed = Number(String(value).replace(",", "."));

    if (value.trim() !== "" && (!Number.isFinite(parsed) || parsed < 0)) {
      return;
    }

    setProducts((current) =>
      current.map((product) =>
        product.id === id && !product.bought
          ? { ...product, price: parsed || 0 }
          : product
      )
    );
  }

  function handleTouchStart(event, product) {
    if (product.bought) return;

    touchStart.current[product.id] = event.touches[0].clientX;
    touchCurrent.current[product.id] = 0;
  }

  function handleTouchMove(event, product) {
    if (product.bought) return;

    const start = touchStart.current[product.id];
    if (start === undefined) return;

    const dx = event.touches[0].clientX - start;
    touchCurrent.current[product.id] = dx;

    const card = event.currentTarget;
    card.style.transform = `translateX(${Math.max(-100, Math.min(100, dx))}px)`;
  }

  function handleTouchEnd(event, product) {
    if (product.bought) return;

    const dx = touchCurrent.current[product.id] || 0;
    const card = event.currentTarget;

    card.style.transform = "";

    delete touchStart.current[product.id];
    delete touchCurrent.current[product.id];

    if (dx < -65) {
      // Arrastar para a esquerda: excluir.
      deleteProduct(product.id);
    } else if (dx > 65) {
      // Arrastar para a direita: editar.
      openEdit(product);
    }
  }

  function finishPurchase() {
    if (products.length === 0) {
      showToast("Adicione produtos antes de finalizar.");
      setConfirmFinish(false);
      return;
    }

    const purchase = {
      id: createId(),
      date: new Date().toISOString(),
      items: products.map((product) => ({ ...product })),
      total,
    };

    setHistory((current) => [purchase, ...current]);
    setProducts([]);
    setConfirmFinish(false);
    setTab("historico");
    resetForm();
    showToast("Compra salva no histórico!");
  }

  function deleteHistory(id) {
    setHistory((current) =>
      current.filter((purchase) => purchase.id !== id)
    );

    if (details?.id === id) {
      setDetails(null);
    }

    setDeleteHistoryConfirm(null);
    showToast("Registro excluído do histórico.");
  }

  function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "Data não disponível";

    return date.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  const styles = `
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #f7f3fc;
      color: #28143b;
      font-family: Arial, Helvetica, sans-serif;
    }
    button, input { font: inherit; }
    button { cursor: pointer; }
    .app {
      min-height: 100vh;
      max-width: 680px;
      margin: auto;
      padding-bottom: 26px;
    }
    .header {
      color: white;
      background: linear-gradient(135deg, #5a189a, #7b2cbf);
      padding: 26px 20px 24px;
      border-radius: 0 0 25px 25px;
      box-shadow: 0 5px 18px #5a189a30;
    }
    .header h1 { margin: 0; font-size: 27px; }
    .header p { margin: 8px 0 0; opacity: .88; font-size: 14px; }
    .tabs {
      display: flex;
      gap: 9px;
      padding: 17px 16px 8px;
    }
    .tab {
      flex: 1;
      border: 1px solid #e4d5f5;
      border-radius: 12px;
      padding: 12px 8px;
      background: white;
      color: #5a189a;
      font-weight: 700;
    }
    .tab.active { background: #5a189a; color: white; border-color: #5a189a; }
    .content { padding: 12px 16px; }
    .panel {
      background: white;
      border-radius: 17px;
      padding: 17px;
      margin-bottom: 15px;
      box-shadow: 0 4px 15px #35104d0b;
    }
    .panel h2 { font-size: 18px; margin: 0 0 14px; }
    .field { display: block; margin-bottom: 12px; }
    .field span { display: block; font-size: 13px; font-weight: 700; margin-bottom: 6px; }
    .field input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ded2eb;
      border-radius: 10px;
      background: #fff;
      outline-color: #7b2cbf;
      color: #28143b;
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .btn {
      border: 0;
      border-radius: 11px;
      padding: 12px 14px;
      font-weight: 700;
    }
    .primary { background: #5a189a; color: white; }
    .secondary { background: #eee3fa; color: #5a189a; }
    .danger { background: #ffebee; color: #b42332; }
    .muted { color: #796b86; font-size: 13px; }
    .product {
      background: white;
      border-radius: 15px;
      margin-bottom: 11px;
      padding: 14px;
      border: 1px solid #eee6f6;
      box-shadow: 0 3px 12px #35104d0a;
      transition: transform .18s ease, opacity .18s ease;
      touch-action: pan-y;
    }
    .product.bought { background: #f0e9f8; opacity: .85; }
    .product-top { display: flex; align-items: flex-start; gap: 10px; }
    .check {
      width: 23px; height: 23px; flex-shrink: 0;
      accent-color: #5a189a; margin-top: 2px;
    }
    .product-main { flex: 1; min-width: 0; }
    .product-name { font-weight: 700; overflow-wrap: anywhere; }
    .product.bought .product-name { text-decoration: line-through; color: #796b86; }
    .product-total { font-weight: 700; color: #5a189a; white-space: nowrap; }
    .product-controls {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 10px; margin: 13px 0 0 33px;
    }
    .small-label { font-size: 12px; color: #796b86; display: block; margin-bottom: 5px; }
    .inline-input {
      width: 100%; min-width: 0; padding: 8px;
      border: 1px solid #ded2eb; border-radius: 8px;
    }
    .quantity {
      display: flex; align-items: center; justify-content: space-between;
      gap: 8px; border: 1px solid #ded2eb; border-radius: 8px; padding: 3px;
    }
    .quantity button {
      width: 29px; height: 29px; border: 0; border-radius: 6px;
      background: #eee3fa; color: #5a189a; font-weight: 700;
    }
    .quantity strong { font-size: 14px; }
    .product-actions { display: flex; gap: 8px; margin: 12px 0 0 33px; }
    .product-actions button { flex: 1; padding: 9px 5px; font-size: 13px; }
    .gesture-hint {
      display: flex; justify-content: space-between; gap: 8px;
      font-size: 11px; color: #887994; padding: 0 3px 12px;
    }
    .summary {
      background: #5a189a; color: white; border-radius: 17px;
      padding: 17px; margin-top: 15px;
    }
    .summary-line { display: flex; justify-content: space-between; gap: 10px; }
    .summary-total { font-size: 24px; font-weight: 800; margin: 7px 0 15px; }
    .summary .btn { width: 100%; background: white; color: #5a189a; }
    .history-card {
      background: white; border: 1px solid #eee6f6;
      border-radius: 15px; padding: 15px; margin-bottom: 11px;
    }
    .history-card h3 { font-size: 16px; margin: 0 0 7px; }
    .history-actions { display: flex; gap: 8px; margin-top: 12px; }
    .history-actions button { flex: 1; }
    .empty {
      text-align: center; padding: 32px 18px; color: #796b86;
      background: white; border-radius: 16px;
    }
    .empty .emoji { font-size: 38px; margin-bottom: 8px; }
    .overlay {
      position: fixed; inset: 0; z-index: 10;
      background: #1c0b2bcc; display: flex; align-items: center;
      justify-content: center; padding: 18px;
    }
    .modal {
      width: 100%; max-width: 430px; max-height: 85vh; overflow: auto;
      background: white; border-radius: 18px; padding: 21px;
    }
    .modal h2 { margin: 0 0 12px; font-size: 20px; }
    .modal p { line-height: 1.5; color: #665572; }
    .modal-actions { display: flex; gap: 9px; margin-top: 18px; }
    .modal-actions button { flex: 1; }
    .detail-item {
      display: flex; justify-content: space-between; gap: 10px;
      padding: 10px 0; border-bottom: 1px solid #eee6f6;
    }
    .toast {
      position: fixed; z-index: 20; bottom: 20px; left: 50%;
      transform: translateX(-50%); background: #28143b; color: white;
      padding: 12px 18px; border-radius: 12px; box-shadow: 0 4px 20px #0002;
      max-width: calc(100% - 30px); text-align: center; font-size: 14px;
    }
    @media (max-width: 380px) {
      .content { padding-left: 11px; padding-right: 11px; }
      .product-controls { margin-left: 0; }
      .product-actions { margin-left: 0; }
      .product-total { font-size: 13px; }
    }
  `;

  return (
    <>
      <style>{styles}</style>

      <main className="app">
        <header className="header">
          <h1>🛒 Minha Compra</h1>
          <p>Organize sua lista e acompanhe seus gastos.</p>
        </header>

        <nav className="tabs">
          <button
            className={`tab ${tab === "lista" ? "active" : ""}`}
            onClick={() => setTab("lista")}
          >
            🛍️ Minha lista
          </button>
          <button
            className={`tab ${tab === "historico" ? "active" : ""}`}
            onClick={() => setTab("historico")}
          >
            📚 Histórico ({history.length})
          </button>
        </nav>

        {tab === "lista" && (
          <section className="content">
            <form className="panel" onSubmit={saveProduct}>
              <h2>{editingId ? "✏️ Editar produto" : "➕ Adicionar produto"}</h2>

              <label className="field">
                <span>Nome do produto</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Ex.: Arroz, leite, pão..."
                  maxLength={100}
                />
              </label>

              <div className="form-row">
                <label className="field">
                  <span>Preço (R$)</span>
                  <input
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                  />
                </label>

                <label className="field">
                  <span>Quantidade</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                  />
                </label>
              </div>

              <button className="btn primary" type="submit" style={{ width: "100%" }}>
                {editingId ? "Salvar alterações" : "Adicionar à lista"}
              </button>

              {editingId && (
                <button
                  className="btn secondary"
                  type="button"
                  style={{ width: "100%", marginTop: 8 }}
                  onClick={resetForm}
                >
                  Cancelar edição
                </button>
              )}
            </form>

            <div className="summary-line" style={{ padding: "5px 3px 12px" }}>
              <strong>Seus produtos ({products.length})</strong>
              <span className="muted">{boughtCount} marcado(s) como comprado(s)</span>
            </div>

            {products.length === 0 ? (
              <div className="empty">
                <div className="emoji">🛒</div>
                <strong>Sua lista está vazia</strong>
                <p>Adicione seu primeiro produto acima.</p>
              </div>
            ) : (
              <>
                <div className="gesture-hint">
                  <span>← Arraste para excluir</span>
                  <span>Arraste para editar →</span>
                </div>

                {products.map((product) => (
                  <article
                    key={product.id}
                    className={`product ${product.bought ? "bought" : ""}`}
                    onTouchStart={(event) => handleTouchStart(event, product)}
                    onTouchMove={(event) => handleTouchMove(event, product)}
                    onTouchEnd={(event) => handleTouchEnd(event, product)}
                  >
                    <div className="product-top">
                      <input
                        className="check"
                        type="checkbox"
                        checked={product.bought}
                        onChange={() => toggleBought(product.id)}
                        aria-label={`Marcar ${product.name} como comprado`}
                      />

                      <div className="product-main">
                        <div className="product-name">{product.name}</div>
                        <div className="muted">
                          {money(product.price)} por unidade
                        </div>
                      </div>

                      <div className="product-total">
                        {money(product.price * product.quantity)}
                      </div>
                    </div>

                    <div className="product-controls">
                      <div>
                        <span className="small-label">Preço unitário (R$)</span>
                        <input
                          className="inline-input"
                          type="number"
                          min="0"
                          step="0.01"
                          inputMode="decimal"
                          value={product.price}
                          disabled={product.bought}
                          onChange={(event) =>
                            changePrice(product.id, event.target.value)
                          }
                        />
                      </div>

                      <div>
                        <span className="small-label">Quantidade</span>
                        <div className="quantity">
                          <button
                            type="button"
                            disabled={product.bought}
                            onClick={() => changeQuantity(product.id, -1)}
                            aria-label="Diminuir quantidade"
                          >
                            −
                          </button>
                          <strong>{product.quantity}</strong>
                          <button
                            type="button"
                            disabled={product.bought}
                            onClick={() => changeQuantity(product.id, 1)}
                            aria-label="Aumentar quantidade"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="product-actions">
                      <button
                        type="button"
                        className="btn secondary"
                        disabled={product.bought}
                        onClick={() => openEdit(product)}
                      >
                        ✏️ Editar nome
                      </button>
                      <button
                        type="button"
                        className="btn danger"
                        onClick={() => deleteProduct(product.id)}
                      >
                        🗑️ Excluir
                      </button>
                    </div>

                    {product.bought && (
                      <p className="muted" style={{ margin: "10px 0 0 33px" }}>
                        🔒 Produto marcado: desmarque para editar preço, quantidade ou nome.
                      </p>
                    )}
                  </article>
                ))}
              </>
            )}

            <section className="summary">
              <div className="summary-line">
                <span>Valor total dos produtos</span>
                <span>{products.length} item(ns)</span>
              </div>
              <div className="summary-total">{money(total)}</div>
              <div className="summary-line" style={{ marginBottom: 14, fontSize: 13 }}>
                <span>Produtos marcados como comprados</span>
                <strong>{boughtCount}/{products.length}</strong>
              </div>
              <button
                className="btn"
                type="button"
                onClick={() => setConfirmFinish(true)}
              >
                ✓ Finalizar compra
              </button>
            </section>
          </section>
        )}

        {tab === "historico" && (
          <section className="content">
            <div className="panel">
              <h2>📚 Histórico de compras</h2>
              <p className="muted" style={{ marginBottom: 0 }}>
                Suas compras finalizadas ficam salvas aqui, mesmo quando você fecha o aplicativo.
              </p>
            </div>

            {history.length === 0 ? (
              <div className="empty">
                <div className="emoji">📋</div>
                <strong>Nenhuma compra salva</strong>
                <p>Quando você finalizar uma compra, ela aparecerá aqui.</p>
              </div>
            ) : (
              history.map((purchase) => {
                const items = Array.isArray(purchase.items) ? purchase.items : [];
                const purchaseTotal = Number(
                  purchase.total ??
                    items.reduce(
                      (sum, item) =>
                        sum + Number(item.price || 0) * Number(item.quantity || 1),
                      0
                    )
                );

                return (
                  <article className="history-card" key={purchase.id}>
                    <h3>🛍️ Compra realizada</h3>
                    <p className="muted">{formatDate(purchase.date)}</p>
                    <div className="summary-line">
                      <span>{items.length} produto(s)</span>
                      <strong style={{ color: "#5a189a" }}>
                        {money(purchaseTotal)}
                      </strong>
                    </div>

                    <div className="history-actions">
                      <button
                        className="btn secondary"
                        type="button"
                        onClick={() => setDetails(purchase)}
                      >
                        👁️ Ver detalhes
                      </button>
                      <button
                        className="btn danger"
                        type="button"
                        onClick={() => setDeleteHistoryConfirm(purchase.id)}
                      >
                        🗑️ Excluir
                      </button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        )}
      </main>

      {confirmFinish && (
        <div className="overlay" onClick={() => setConfirmFinish(false)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Finalizar compra?</h2>
            <p>
              A compra será salva no histórico e os produtos sairão da lista atual.
            </p>
            <div className="summary-line">
              <span>Total da compra</span>
              <strong>{money(total)}</strong>
            </div>
            <div className="summary-line" style={{ marginTop: 8 }}>
              <span>Produtos na lista</span>
              <strong>{products.length}</strong>
            </div>
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setConfirmFinish(false)}
              >
                Voltar
              </button>
              <button className="btn primary" onClick={finishPurchase}>
                Confirmar
              </button>
            </div>
          </section>
        </div>
      )}

      {deleteHistoryConfirm && (
        <div
          className="overlay"
          onClick={() => setDeleteHistoryConfirm(null)}
        >
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Excluir registro?</h2>
            <p>
              Esta ação excluirá somente esta compra do histórico. Os outros registros serão mantidos.
            </p>
            <div className="modal-actions">
              <button
                className="btn secondary"
                onClick={() => setDeleteHistoryConfirm(null)}
              >
                Cancelar
              </button>
              <button
                className="btn danger"
                onClick={() => deleteHistory(deleteHistoryConfirm)}
              >
                Excluir compra
              </button>
            </div>
          </section>
        </div>
      )}

      {details && (
        <div className="overlay" onClick={() => setDetails(null)}>
          <section className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>Detalhes da compra</h2>
            <p>{formatDate(details.date)}</p>

            {(Array.isArray(details.items) ? details.items : []).map((item, index) => (
              <div className="detail-item" key={`${details.id}-${index}`}>
                <div>
                  <strong>{item.name}</strong>
                  <div className="muted">
                    {item.quantity || 1} × {money(item.price)}
                  </div>
                </div>
                <strong>
                  {money(Number(item.price || 0) * Number(item.quantity || 1))}
                </strong>
              </div>
            ))}

            <div className="summary-line" style={{ marginTop: 17 }}>
              <strong>Total</strong>
              <strong style={{ color: "#5a189a", fontSize: 20 }}>
                {money(
                  details.total ??
                    (details.items || []).reduce(
                      (sum, item) =>
                        sum + Number(item.price || 0) * Number(item.quantity || 1),
                      0
                    )
                )}
              </strong>
            </div>

            <button
              className="btn primary"
              style={{ width: "100%", marginTop: 18 }}
              onClick={() => setDetails(null)}
            >
              Fechar
            </button>
          </section>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}

const rootElement = document.getElementById("root");

if (rootElement) {
  createRoot(rootElement).render(<App />);
}
