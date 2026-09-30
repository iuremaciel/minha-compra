import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Plus,
  Trash2,
  Check,
  ShoppingCart,
  History,
  X,
  ChevronRight,
  RotateCcw
} from "lucide-react";

import "./styles.css";

const PK = "mc-products";
const CK = "mc-cart";
const HK = "mc-history";

const starter = [
  {
    id: crypto.randomUUID(),
    name: "Arroz",
    price: 0
  },
  {
    id: crypto.randomUUID(),
    name: "Feijão",
    price: 0
  },
  {
    id: crypto.randomUUID(),
    name: "Leite",
    price: 0
  },
  {
    id: crypto.randomUUID(),
    name: "Café",
    price: 0
  }
];

const load = (key, fallback) => {
  try {
    return JSON.parse(
      localStorage.getItem(key)
    ) ?? fallback;
  } catch {
    return fallback;
  }
};

const money = (value) =>
  Number(value || 0).toLocaleString(
    "pt-BR",
    {
      style: "currency",
      currency: "BRL"
    }
  );

function App() {

  const [products, setProducts] =
    useState(() => load(PK, starter));

  const [cart, setCart] =
    useState(() => load(CK, {}));

  const [history, setHistory] =
    useState(() => load(HK, []));

  const [tab, setTab] =
    useState("comprar");

  const [modal, setModal] =
    useState(null);

  const [name, setName] =
    useState("");

  const [detail, setDetail] =
    useState(null);

  const [toast, setToast] =
    useState("");

  const [swipeStart, setSwipeStart] =
    useState(null);

  const [swipe, setSwipe] =
    useState(null);


  useEffect(() => {
    localStorage.setItem(
      PK,
      JSON.stringify(products)
    );
  }, [products]);


  useEffect(() => {
    localStorage.setItem(
      CK,
      JSON.stringify(cart)
    );
  }, [cart]);


  useEffect(() => {
    localStorage.setItem(
      HK,
      JSON.stringify(history)
    );
  }, [history]);


  const total = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum +
          Number(
            cart[p.id]?.qty || 0
          ) *
          Number(
            cart[p.id]?.price ??
            p.price ??
            0
          ),
        0
      ),
    [products, cart]
  );


  const count = useMemo(
    () =>
      products.reduce(
        (sum, p) =>
          sum +
          Number(
            cart[p.id]?.qty || 0
          ),
        0
      ),
    [products, cart]
  );


  const showToast = (message) => {

    setToast(message);

    setTimeout(() => {
      setToast("");
    }, 1800);

  };


  const updateCart = (
    id,
    changes
  ) => {

    setCart((current) => ({
      ...current,

      [id]: {
        qty: 0,

        price:
          products.find(
            (p) => p.id === id
          )?.price || 0,

        bought: false,

        ...(current[id] || {}),

        ...changes
      }
    }));

  };


  const changeQty = (
    id,
    delta
  ) => {

    updateCart(id, {
      qty: Math.max(
        0,
        Number(
          cart[id]?.qty || 0
        ) + delta
      )
    });

  };


  function add(e) {

    e.preventDefault();

    const productName =
      name.trim();

    if (!productName) return;

    setProducts(
      (current) => [
        ...current,

        {
          id: crypto.randomUUID(),
          name: productName,
          price: 0
        }
      ]
    );

    setName("");

    setModal(null);

    showToast(
      "Produto adicionado"
    );
  }


  function edit(e) {

    e.preventDefault();

    const productName =
      name.trim();

    if (
      !productName ||
      !modal ||
      modal === "add"
    ) {
      return;
    }

    setProducts(
      (current) =>
        current.map((p) =>
          p.id === modal.id
            ? {
                ...p,
                name: productName
              }
            : p
        )
    );

    setName("");

    setModal(null);

    showToast(
      "Nome do produto alterado"
    );
  }


  function removeProduct(id) {

    const product =
      products.find(
        (p) => p.id === id
      );

    if (!product) return;

    if (
      !window.confirm(
        `Excluir "${product.name}" da lista permanente?`
      )
    ) {
      return;
    }

    setProducts(
      (current) =>
        current.filter(
          (p) => p.id !== id
        )
    );

    setCart((current) => {

      const next = {
        ...current
      };

      delete next[id];

      return next;

    });

    showToast(
      "Produto excluído"
    );
  }


  /* =====================================================
     GESTO DE ARRASTAR
     ===================================================== */

  function handleSwipeStart(
    e,
    id
  ) {

    const touch =
      e.touches?.[0];

    if (!touch) return;

    setSwipeStart({
      id,
      x: touch.clientX,
      y: touch.clientY
    });

    setSwipe({
      id,
      dx: 0,
      active: true
    });
  }


  function handleSwipeMove(
    e,
    id
  ) {

    if (
      !swipeStart ||
      swipeStart.id !== id
    ) {
      return;
    }

    const touch =
      e.touches?.[0];

    if (!touch) return;

    const rawDx =
      touch.clientX -
      swipeStart.x;

    const dy =
      Math.abs(
        touch.clientY -
        swipeStart.y
      );

    /*
      Evita confundir uma rolagem
      vertical com o gesto horizontal.
    */

    if (
      dy >
      Math.abs(rawDx) + 18
    ) {
      return;
    }

    const max = 145;

    const dx =
      Math.max(
        -max,
        Math.min(
          max,
          rawDx
        )
      );

    setSwipe({
      id,
      dx,
      active: true
    });
  }


  function handleSwipeEnd(
    e,
    id
  ) {

    if (
      !swipeStart ||
      swipeStart.id !== id
    ) {
      return;
    }

    const touch =
      e.changedTouches?.[0];

    const dx = touch
      ? touch.clientX -
        swipeStart.x
      : 0;

    const dy = touch
      ? Math.abs(
          touch.clientY -
          swipeStart.y
        )
      : 0;

    setSwipeStart(null);


    /*
      Se o movimento foi pequeno,
      cancela o gesto.
    */

    if (
      Math.abs(dx) < 80 ||
      dy >
        Math.abs(dx) * 0.8
    ) {

      setSwipe(null);

      return;
    }


    /*
      ESQUERDA = EXCLUIR
    */

    if (dx < 0) {

      setSwipe({
        id,
        dx: -145,
        active: true,
        action: "delete"
      });

      setTimeout(() => {

        removeProduct(id);

        setSwipe(null);

      }, 180);

      return;
    }


    /*
      DIREITA = EDITAR
    */

    setSwipe({
      id,
      dx: 145,
      active: true,
      action: "edit"
    });


    setTimeout(() => {

      const product =
        products.find(
          (p) => p.id === id
        );

      setSwipe(null);

      if (product) {

        setModal(product);

        setName(
          product.name
        );

      }

    }, 180);

  }


  /* =====================================================
     FINALIZAR COMPRA
     ===================================================== */

  function finish() {

    if (!count) {

      showToast(
        "Adicione pelo menos 1 item"
      );

      return;
    }


    const items =
      products
        .filter(
          (p) =>
            (cart[p.id]?.qty || 0) >
            0
        )
        .map((p) => ({
          name: p.name,

          qty: Number(
            cart[p.id].qty
          ),

          price: Number(
            cart[p.id].price ??
            p.price ??
            0
          )
        }));


    setHistory(
      (current) => [
        {
          id: crypto.randomUUID(),

          date:
            new Date().toISOString(),

          items,

          total:
            items.reduce(
              (
                sum,
                item
              ) =>
                sum +
                item.qty *
                  item.price,
              0
            )
        },

        ...current
      ]
    );


    setCart({});

    showToast(
      "Compra salva no histórico"
    );
  }


  /* =====================================================
     EXCLUIR HISTÓRICO INDIVIDUAL
     ===================================================== */

  function deleteHistoryItem(
    id
  ) {

    const purchase =
      history.find(
        (p) => p.id === id
      );

    if (!purchase) return;


    if (
      !window.confirm(
        `Excluir a compra de ${new Date(
          purchase.date
        ).toLocaleDateString(
          "pt-BR"
        )} do histórico?`
      )
    ) {
      return;
    }


    setHistory(
      (current) =>
        current.filter(
          (p) => p.id !== id
        )
    );


    if (
      detail?.id === id
    ) {
      setDetail(null);
    }


    showToast(
      "Compra excluída do histórico"
    );
  }


  /* =====================================================
     LIMPAR TODO O HISTÓRICO
     ===================================================== */

  function clearHistory() {

    if (!history.length) {
      return;
    }


    if (
      !window.confirm(
        "Excluir todo o histórico de compras? Essa ação não pode ser desfeita."
      )
    ) {
      return;
    }


    setHistory([]);

    setDetail(null);

    showToast(
      "Histórico excluído"
    );
  }


  /* =====================================================
     REUTILIZAR COMPRA
     ===================================================== */

  function reopenPurchase(
    purchase
  ) {

    const next = {};


    purchase.items.forEach(
      (item) => {

        const product =
          products.find(
            (p) =>
              p.name.toLowerCase() ===
              item.name.toLowerCase()
          );


        if (product) {

          next[product.id] = {

            qty: item.qty,

            price: item.price,

            bought: false

          };

        }

      }
    );


    setCart(next);

    setDetail(null);

    setTab("comprar");

    showToast(
      "Itens da compra foram carregados"
    );
  }


  /* =====================================================
     LIMPAR COMPRA ATUAL
     ===================================================== */

  function clearCurrent() {

    if (!count) return;


    if (
      window.confirm(
        "Limpar todos os itens da compra atual?"
      )
    ) {

      setCart({});

    }

  }


  return (

    <div className="app">


      {/* =================================================
          CABEÇALHO
          ================================================= */}

      <header>

        <div className="brand">

          <ShoppingCart />

          Minha Compra

        </div>

        <small>
          Lista de compras simples e rápida
        </small>

      </header>


      <main>


        {/* =================================================
            TELA DE COMPRA
            ================================================= */}

        {tab === "comprar" ? (

          <>

            <section className="title">

              <div>

                <h1>
                  Minha compra
                </h1>

                <p>

                  {count
                    ? `${count} ${
                        count === 1
                          ? "item"
                          : "itens"
                      } na compra`
                    : "Comece adicionando as quantidades."
                  }

                </p>

              </div>


              <div className="title-actions">

                {count > 0 && (

                  <button
                    className="clear-current"
                    onClick={
                      clearCurrent
                    }
                    title="Limpar compra"
                  >

                    <RotateCcw
                      size={18}
                    />

                  </button>

                )}


                <button
                  className="add"
                  onClick={() => {

                    setName("");

                    setModal("add");

                  }}
                >

                  <Plus />

                  Produto

                </button>

              </div>

            </section>


            {/* DICA DO GESTO */}

            <div className="swipe-hint">

              <span>
                ← arraste para excluir
              </span>

              <span>
                arraste para editar →
              </span>

            </div>


            <div className="list">


              {products.map(
                (p) => {

                  const c =
                    cart[p.id] ||
                    {};

                  const q =
                    Number(
                      c.qty || 0
                    );

                  const price =
                    c.price ??
                    p.price ??
                    0;


                  return (

                    <div
                      className={

                        "swipe-row " +

                        (
                          swipe?.id ===
                            p.id &&
                          swipe.active
                            ? "swiping "
                            : ""
                        ) +

                        (
                          swipe?.id ===
                            p.id &&
                          swipe.action ===
                            "delete"
                            ? "confirm-delete "
                            : ""
                        ) +

                        (
                          swipe?.id ===
                            p.id &&
                          swipe.action ===
                            "edit"
                            ? "confirm-edit"
                            : ""
                        )

                      }

                      key={p.id}
                    >


                      {/* FUNDO VERMELHO */}

                      <div className="swipe-action swipe-delete">

                        <Trash2
                          size={22}
                        />

                        <span>
                          Excluir
                        </span>

                      </div>


                      {/* FUNDO VERDE */}

                      <div className="swipe-action swipe-edit">

                        <span className="edit-icon">
                          ✎
                        </span>

                        <span>
                          Editar
                        </span>

                      </div>


                      {/* CARTÃO */}

                      <article

                        className={

                          c.bought
                            ? "bought swipe-card"
                            : "swipe-card"

                        }


                        style={{

                          transform:

                            swipe?.id ===
                            p.id

                              ? `translateX(${swipe.dx}px)`

                              : "translateX(0)"

                        }}


                        onTouchStart={
                          (e) =>
                            handleSwipeStart(
                              e,
                              p.id
                            )
                        }


                        onTouchMove={
                          (e) =>
                            handleSwipeMove(
                              e,
                              p.id
                            )
                        }


                        onTouchEnd={
                          (e) =>
                            handleSwipeEnd(
                              e,
                              p.id
                            )
                        }

                      >


                        {/* CHECK */}

                        <button

                          className={

                            "check " +

                            (
                              c.bought
                                ? "on"
                                : ""
                            )

                          }


                          onClick={() =>

                            updateCart(
                              p.id,
                              {
                                bought:
                                  !c.bought
                              }
                            )

                          }

                        >

                          {c.bought && (
                            <Check />
                          )}

                        </button>


                        {/* NOME + PREÇO */}

                        <div className="info">

                          <b>
                            {p.name}
                          </b>


                          <label>

                            R${" "}

                            <input

                              inputMode="decimal"

                              value={

                                price

                                  ? String(
                                      price
                                    ).replace(
                                      ".",
                                      ","
                                    )

                                  : ""

                              }

                              placeholder="0,00"

                              onChange={
                                (e) =>
                                  updateCart(
                                    p.id,
                                    {
                                      price:
                                        e.target.value.replace(
                                          ",",
                                          "."
                                        )
                                    }
                                  )
                              }

                            />

                          </label>

                        </div>


                        {/* QUANTIDADE */}

                        <div className="q">

                          <button

                            disabled={!q}

                            onClick={() =>
                              changeQty(
                                p.id,
                                -1
                              )
                            }

                          >
                            −
                          </button>


                          <strong>
                            {q}
                          </strong>


                          <button

                            onClick={() =>
                              changeQty(
                                p.id,
                                1
                              )
                            }

                          >
                            +
                          </button>

                        </div>


                        {/* TOTAL DO ITEM */}

                        <strong className="line">

                          {money(
                            q *
                              Number(
                                price ||
                                  0
                              )
                          )}

                        </strong>


                      </article>

                    </div>

                  );

                }
              )}

            </div>

          </>

        ) : (


          /* =================================================
             HISTÓRICO
             ================================================= */

          <>

            <section className="title">

              <div>

                <h1>
                  Histórico
                </h1>

                <p>
                  Compras finalizadas
                </p>

              </div>


              {history.length >
                0 && (

                <button

                  className="clear-history"

                  onClick={
                    clearHistory
                  }

                >

                  <Trash2
                    size={18}
                  />

                  Limpar

                </button>

              )}

            </section>


            {!history.length ? (

              <div className="empty">

                <History
                  size={42}
                />

                <h3>
                  Nenhuma compra salva
                </h3>

                <p>
                  Finalize uma compra para
                  vê-la aqui.
                </p>

              </div>

            ) : (

              <div className="history">


                {history.map(
                  (p) => (

                    <div
                      className="history-card"
                      key={p.id}
                    >

                      <button

                        className="history-open"

                        onClick={() =>
                          setDetail(p)
                        }

                      >

                        <span className="hi">

                          <History />

                        </span>


                        <span className="hm">

                          <b>

                            {new Date(
                              p.date
                            ).toLocaleDateString(
                              "pt-BR"
                            )}

                          </b>


                          <small>

                            {p.items.reduce(
                              (
                                sum,
                                i
                              ) =>
                                sum +
                                i.qty,
                              0
                            )}

                            {" "}
                            itens

                          </small>

                        </span>


                        <strong>
                          {money(
                            p.total
                          )}
                        </strong>


                        <ChevronRight />

                      </button>


                      <button

                        className="history-delete"

                        title="Excluir compra"

                        aria-label="Excluir compra"

                        onClick={() =>
                          deleteHistoryItem(
                            p.id
                          )
                        }

                      >

                        <Trash2
                          size={18}
                        />

                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </>

        )}

      </main>


      {/* =================================================
          TOTAL
          ================================================= */}

      {tab === "comprar" && (

        <div className="checkout">

          <div>

            <small>
              Total da compra
            </small>

            <strong>
              {money(total)}
            </strong>

          </div>


          <button
            onClick={finish}
          >

            Finalizar compra

            <Check />

          </button>

        </div>

      )}


      {/* =================================================
          MENU INFERIOR
          ================================================= */}

      <nav>

        <button

          className={
            tab === "comprar"
              ? "sel"
              : ""
          }

          onClick={() =>
            setTab("comprar")
          }

        >

          <ShoppingCart />

          Comprar

        </button>


        <button

          className={
            tab === "historico"
              ? "sel"
              : ""
          }

          onClick={() =>
            setTab("historico")
          }

        >

          <History />

          Histórico

        </button>

      </nav>


      {/* =================================================
          MODAL DE PRODUTO
          ================================================= */}

      {modal && (

        <div
          className="back"
          onMouseDown={() =>
            setModal(null)
          }
        >

          <form

            className="modal"

            onSubmit={
              modal === "add"
                ? add
                : edit
            }

            onMouseDown={
              (e) =>
                e.stopPropagation()
            }

          >

            <div className="mh">

              <h2>

                {modal === "add"
                  ? "Novo produto"
                  : "Editar produto"}

              </h2>


              <button

                type="button"

                onClick={() =>
                  setModal(null)
                }

              >

                <X />

              </button>

            </div>


            <label>
              Nome do produto
            </label>


            <input

              autoFocus

              value={name}

              onChange={(e) =>
                setName(
                  e.target.value
                )
              }

              placeholder="Ex.: Sabonete"

            />


            <button className="primary">

              <Check />

              Salvar

            </button>

          </form>

        </div>

      )}


      {/* =================================================
          DETALHES DO HISTÓRICO
          ================================================= */}

      {detail && (

        <div
          className="back"
          onMouseDown={() =>
            setDetail(null)
          }
        >

          <div

            className="modal"

            onMouseDown={
              (e) =>
                e.stopPropagation()
            }

          >

            <div className="mh">

              <div>

                <h2>
                  Detalhes da compra
                </h2>

                <small>

                  {new Date(
                    detail.date
                  ).toLocaleString(
                    "pt-BR"
                  )}

                </small>

              </div>


              <button
                onClick={() =>
                  setDetail(null)
                }
              >

                <X />

              </button>

            </div>


            {detail.items.map(
              (item, index) => (

                <div
                  className="row"
                  key={index}
                >

                  <span>

                    {item.qty}×{" "}
                    {item.name}

                  </span>

                  <b>

                    {money(
                      item.qty *
                        item.price
                    )}

                  </b>

                </div>

              )
            )}


            <div className="dt">

              <span>
                Total
              </span>

              <b>
                {money(
                  detail.total
                )}
              </b>

            </div>


            <button

              className="primary"

              onClick={() =>
                reopenPurchase(
                  detail
                )
              }

            >

              Reutilizar esta compra

            </button>


            <button

              className="danger-button"

              onClick={() =>
                deleteHistoryItem(
                  detail.id
                )
              }

            >

              <Trash2
                size={18}
              />

              Excluir esta compra

            </button>

          </div>

        </div>

      )}


      {/* =================================================
          AVISO
          ================================================= */}

      {toast && (

        <div className="toast">

          {toast}

        </div>

      )}

    </div>

  );
}


createRoot(
  document.getElementById("root")
).render(
  <App />
);
