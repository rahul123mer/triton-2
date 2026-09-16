import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Minus, Plus, RotateCcw, Save, Scale, Trash2, X } from "lucide-react";
import { cookbookApi, recipeApi } from "../lib/api";
import { DeleteButton } from "../components/DeleteButton";
import { useUnsavedChanges } from "../hooks/useUnsavedChanges";
import { usePrincipal } from "../hooks/usePrincipal";
import {
  Button,
  Card,
  ErrorCard,
  LoadingCards,
  Modal,
  SectionLabel,
  StatusPill,
  SuccessNote,
} from "../components/ui";

export function CookbooksPage() {
  const access = usePrincipal();
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["cookbooks"],
    queryFn: cookbookApi.list,
  });
  const [selected, setSelected] = useState(null);
  const [draft, setDraft] = useState([]);
  const [cloneOpen, setCloneOpen] = useState(false);
  const [cloneName, setCloneName] = useState("");
  useEffect(() => {
    const cookbook =
      query.data?.find((item) => item.cookbook_id === selected) ||
      query.data?.[0];
    if (cookbook) {
      setSelected(cookbook.cookbook_id);
      setDraft(cookbook.recipes.map((recipe) => ({ ...recipe })));
    }
  }, [query.data, selected]);
  const cookbook = query.data?.find((item) => item.cookbook_id === selected);
  const canManage = access.can("cookbook.clone") && cookbook?.editable;
  const total = draft
    .filter((recipe) => recipe.enabled)
    .reduce((sum, recipe) => sum + recipe.weight, 0);
  const original = JSON.stringify(
    cookbook?.recipes.map(({ recipe_id, weight, polarity, enabled }) => ({
      recipe_id,
      weight,
      polarity,
      enabled,
    })) || [],
  );
  const current = JSON.stringify(
    draft.map(({ recipe_id, weight, polarity, enabled }) => ({
      recipe_id,
      weight,
      polarity,
      enabled,
    })),
  );
  const dirty = canManage && original !== current;
  useUnsavedChanges(dirty);
  const clone = useMutation({
    mutationFn: () =>
      cookbookApi.clone({ clone_from: selected, name: cloneName }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["cookbooks"] });
      setSelected(created.cookbook_id);
      setCloneOpen(false);
    },
  });
  // The whole Recipe catalogue, for building a Cookbook rather than cloning one.
  // Only fetched when the form is open: 28 rows nobody looks at otherwise.
  const [buildOpen, setBuildOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const catalogue = useQuery({
    queryKey: ["recipes"],
    queryFn: recipeApi.list,
    enabled: buildOpen || addOpen,
  });
  // The ingredients an authored AI Recipe may require. Fetched with the catalogue,
  // and only when a form that offers them is open.
  const ingredients = useQuery({
    queryKey: ["recipe-ingredients"],
    queryFn: recipeApi.ingredients,
    enabled: buildOpen,
  });
  const author = useMutation({
    mutationFn: (body) => recipeApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recipes"] }),
  });
  const build = useMutation({
    mutationFn: (body) => cookbookApi.create(body),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["cookbooks"] });
      setSelected(created.cookbook_id);
      setBuildOpen(false);
    },
  });
  const remove = useMutation({
    mutationFn: (id) => cookbookApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cookbooks"] });
      setSelected(null);
    },
  });
  // The draft is the INTENDED set, so what changed is the difference between it
  // and what the server holds. `recipes` merges and cannot express a removal, which
  // is why the three go separately -- and together, because dropping a Recipe puts
  // the enabled weights below 100 and the server will not hold a Cookbook there.
  const placement = ({ recipe_id, weight, polarity, enabled }) => ({
    recipe_id,
    weight,
    polarity,
    enabled,
  });
  const save = useMutation({
    mutationFn: () => {
      const before = new Set((cookbook?.recipes || []).map((r) => r.recipe_id));
      const now = new Set(draft.map((r) => r.recipe_id));
      return cookbookApi.update(selected, {
        remove: [...before].filter((id) => !now.has(id)),
        add: draft.filter((r) => !before.has(r.recipe_id)).map(placement),
        recipes: draft.filter((r) => before.has(r.recipe_id)).map(placement),
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cookbooks"] }),
  });
  const dropRecipe = (id) =>
    setDraft((value) => value.filter((recipe) => recipe.recipe_id !== id));
  const addRecipe = (recipe) => {
    setDraft((value) => [
      ...value,
      {
        ...recipe,
        weight: 0,
        polarity: recipe.polarity || "+",
        enabled: true,
      },
    ]);
    setAddOpen(false);
  };
  /* Spread the enabled weights back to exactly 100, keeping their PROPORTIONS.
   *
   * Largest remainder, not Math.round on each: nine recipes rounded independently
   * land on 99 or 101 about as often as on 100, and the server refuses anything
   * that is not exactly 100 -- so a "make it add up" button that sometimes does not
   * is worse than none. The floors are taken first and the leftover points go to
   * the largest fractions, which totals 100 by construction.
   *
   * A set with no weight at all splits evenly; there are no proportions to keep. */
  const rebalance = () =>
    setDraft((rows) => {
      const on = rows
        .map((recipe, index) => index)
        .filter((index) => rows[index].enabled);
      if (!on.length) return rows;
      const sum = on.reduce((n, index) => n + rows[index].weight, 0);
      const raw = on.map((index) =>
        sum > 0 ? (rows[index].weight * 100) / sum : 100 / on.length,
      );
      const floor = raw.map(Math.floor);
      const short = 100 - floor.reduce((a, b) => a + b, 0);
      const rank = raw
        .map((value, k) => [value - floor[k], k])
        .sort((a, b) => b[0] - a[0]);
      const out = rows.map((recipe) => ({ ...recipe }));
      on.forEach((index, k) => {
        out[index].weight = floor[k];
      });
      for (let n = 0; n < short; n += 1) out[on[rank[n][1]]].weight += 1;
      return out;
    });
  const edit = (id, patch) =>
    setDraft((value) =>
      value.map((recipe) =>
        recipe.recipe_id === id ? { ...recipe, ...patch } : recipe,
      ),
    );
  const reset = () =>
    setDraft(cookbook.recipes.map((recipe) => ({ ...recipe })));
  if (query.isError)
    return (
      <div className="page">
        <ErrorCard error={query.error} />
      </div>
    );
  return (
    <div className="page">
      <div className="page-heading">
        <div>
          <SectionLabel blue>COOKBOOK MANAGEMENT</SectionLabel>
          <h2>Cookbooks</h2>
          <p>
            Clone prebuilt Cookbooks and configure the fixed Recipe catalog
            without running inference.
          </p>
        </div>
        {access.can("cookbook.clone") && (
          <div className="heading-actions">
          <Button variant="secondary" onClick={() => setBuildOpen(true)}>
            <Plus size={14} />
            New Cookbook
          </Button>
          <Button
            disabled={!cookbook}
            onClick={() => {
              setCloneName(`${cookbook?.name || "Cookbook"} — Custom`);
              setCloneOpen(true);
            }}
          >
            <Copy size={14} />
            Clone Cookbook
          </Button>
          </div>
        )}
      </div>
      {query.isLoading ? (
        <LoadingCards />
      ) : (
        <div className="cookbook-layout">
          <Card className="cookbook-list">
            <SectionLabel>AVAILABLE COOKBOOKS</SectionLabel>
            {query.data.map((item) => (
              <button
                key={item.cookbook_id}
                className={selected === item.cookbook_id ? "active" : ""}
                onClick={() => setSelected(item.cookbook_id)}
              >
                <div>
                  <strong>{item.name}</strong>
                  <span>
                    v{item.version} · {item.recipes.length} fixed Recipes
                  </span>
                </div>
                <StatusPill status={item.status} />
              </button>
            ))}
          </Card>
          <Card>
            <div className="customizer-head">
              <div>
                <SectionLabel>COOKBOOK CUSTOMIZER</SectionLabel>
                <h3>{cookbook?.name}</h3>
              </div>
              <div className="weight-total-group">
                {canManage && total !== 100 && (
                  <Button variant="secondary" onClick={rebalance}>
                    <Scale size={14} />
                    Rebalance to 100%
                  </Button>
                )}
                <div
                  className={
                    total === 100 ? "weight-total valid" : "weight-total invalid"
                  }
                >
                  <span>Enabled weight</span>
                  <strong>{total}%</strong>
                </div>
              </div>
            </div>
            {!canManage && (
              <div className="readonly-callout">
                This Cookbook is read-only for your current permissions. Recipe
                definitions and prompts are never editable.
              </div>
            )}
            <div className="recipe-editor">
              <div className="recipe-editor-head">
                <span>Remove</span>
                <span>Fixed Recipe</span>
                <span>Polarity</span>
                <span>Weight</span>
              </div>
              {draft.map((recipe) => (
                <div className="recipe-edit-row" key={recipe.recipe_id}>
                  {/* A cross that REMOVES, where a tick used to only disable.
                      Removing is the edit people actually wanted: a disabled
                      Recipe still sat in the list at its old weight. */}
                  <button
                    className="recipe-remove"
                    disabled={!canManage}
                    aria-label={`Remove ${recipe.name} from this Cookbook`}
                    title={
                      canManage
                        ? `Remove ${recipe.name}`
                        : "Clone this Cookbook to change its recipes"
                    }
                    onClick={() => dropRecipe(recipe.recipe_id)}
                  >
                    <X size={13} />
                  </button>
                  <div>
                    <strong>{recipe.name}</strong>
                    <span>
                      {recipe.recipe_id} ·{" "}
                      {recipe.kind === "human"
                        ? "Human scored"
                        : "AI precomputed"}{" "}
                      · {recipe.description}
                    </span>
                  </div>
                  <button
                    disabled={!canManage}
                    title={
                      recipe.polarity === "-"
                        ? "Risk basis uses 100 − score"
                        : "Positive basis"
                    }
                    onClick={() =>
                      edit(recipe.recipe_id, {
                        polarity: recipe.polarity === "+" ? "-" : "+",
                      })
                    }
                  >
                    {recipe.polarity}
                  </button>
                  <div className="weight-stepper">
                    <button
                      aria-label={`Decrease ${recipe.recipe_name} weight`}
                      title={`Decrease ${recipe.recipe_name} weight`}
                      disabled={!canManage || recipe.weight === 0}
                      onClick={() =>
                        edit(recipe.recipe_id, { weight: recipe.weight - 1 })
                      }
                    >
                      <Minus size={12} />
                    </button>
                    <strong>{recipe.weight}%</strong>
                    <button
                      aria-label={`Increase ${recipe.recipe_name} weight`}
                      title={`Increase ${recipe.recipe_name} weight`}
                      disabled={!canManage || recipe.weight === 100}
                      onClick={() =>
                        edit(recipe.recipe_id, { weight: recipe.weight + 1 })
                      }
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                </div>
              ))}
              {canManage && (
                <button className="recipe-add-row" onClick={() => setAddOpen(true)}>
                  <Plus size={14} />
                  Add a recipe
                </button>
              )}
            </div>
            {/* Removing a Recipe frees its weight, and the Cookbook cannot be saved
                until something absorbs it. Both ways out are offered where the
                problem appears rather than left for the reader to work out. */}
            {canManage && total !== 100 && (
              <p className="weight-error">
                Enabled weights total {total}%, not 100%. Add a recipe to take up
                the {total < 100 ? `${100 - total}%` : "excess"}, or rebalance the
                ones you have.
              </p>
            )}
            {save.isSuccess && (
              <SuccessNote>
                Cookbook configuration saved. No Remote Compute or model
                inference ran.
              </SuccessNote>
            )}
            {canManage && (
              <div className="customizer-actions">
                <Button
                  variant="secondary"
                  disabled={!dirty || save.isPending}
                  onClick={reset}
                >
                  <RotateCcw size={14} />
                  Discard changes
                </Button>
                <Button
                  disabled={!dirty || total !== 100 || save.isPending}
                  onClick={() => save.mutate()}
                >
                  <Save size={14} />
                  Save Cookbook
                </Button>
              </div>
            )}
            {total !== 100 && canManage && (
              <p className="weight-error">
                Enabled Recipe weights must total exactly 100% using integer
                weights.
              </p>
            )}
            {save.isError && (
              <p className="weight-error">{save.error.message}</p>
            )}
            {canManage && (
              <div className="cookbook-danger">
                <DeleteButton
                  permission="cookbook.clone"
                  label="Delete Cookbook"
                  name={cookbook.name}
                  note="A Cookbook any Analysis has been scored under cannot be deleted — that Analysis cites it as the question it answered."
                  onDelete={() => remove.mutateAsync(cookbook.cookbook_id)}
                />
                {remove.isError && (
                  <p className="weight-error">{remove.error.message}</p>
                )}
              </div>
            )}
          </Card>
        </div>
      )}
      {addOpen && (
        <Modal
          title="Add a recipe"
          onClose={() => setAddOpen(false)}
          footer={
            <Button variant="secondary" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
          }
        >
          {/* Only Recipes this Cookbook does not already carry: the server refuses
              a duplicate, and offering one is offering a guaranteed error. */}
          {catalogue.isLoading ? (
            <LoadingCards />
          ) : (
            (() => {
              const present = new Set(draft.map((r) => r.recipe_id));
              const spare = (catalogue.data || []).filter(
                (r) => !present.has(r.recipe_id),
              );
              if (!spare.length)
                return (
                  <div className="no-results">
                    This Cookbook already carries every Recipe in the catalogue.
                  </div>
                );
              return (
                <div className="recipe-picker">
                  {spare.map((recipe) => (
                    <button
                      key={recipe.recipe_id}
                      className="recipe-picker-row"
                      onClick={() => addRecipe(recipe)}
                    >
                      <strong>{recipe.name}</strong>
                      <span>
                        {recipe.recipe_id} ·{" "}
                        {recipe.kind === "human"
                          ? "Human scored"
                          : "AI precomputed"}{" "}
                        · {recipe.description}
                      </span>
                    </button>
                  ))}
                </div>
              );
            })()
          )}
          {/* It arrives at 0% on purpose. Taking weight from the others without
              being asked would silently rewrite criteria the reader has already
              tuned; the total goes red until they decide who pays. */}
          <p className="modal-note">
            A recipe is added at 0%. Give it weight and rebalance the rest to 100%
            before saving.
          </p>
        </Modal>
      )}
      {buildOpen && (
        <BuildCookbookModal
          recipes={catalogue.data || []}
          ingredients={ingredients.data || []}
          loading={catalogue.isLoading}
          error={build.error}
          pending={build.isPending}
          onCancel={() => setBuildOpen(false)}
          onCreate={(body) => build.mutate(body)}
          onAuthor={(body) => author.mutateAsync(body)}
        />
      )}
      {cloneOpen && (
        <Modal
          title="Clone Cookbook"
          onClose={() => setCloneOpen(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setCloneOpen(false)}>
                Cancel
              </Button>
              <Button
                disabled={!cloneName.trim() || clone.isPending}
                onClick={() => clone.mutate()}
              >
                <Copy size={14} />
                Create editable copy
              </Button>
            </>
          }
        >
          <label className="field-label">
            Cookbook name
            <input
              value={cloneName}
              onChange={(event) => setCloneName(event.target.value)}
            />
          </label>
          <p className="modal-help">
            The prebuilt source remains immutable. The clone starts with
            identical fixed Recipe configuration.
          </p>
          {clone.isError && (
            <div className="warning-callout" role="alert">
              <p>{clone.error.message}</p>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* Build a Cookbook from the Recipe catalogue.
 *
 * Cloning was the only way in, which works when a near-enough lens exists and not
 * when the question is new -- you inherit somebody else's criteria and re-weight
 * around them.
 *
 * The weight total is shown while you type and the button stays disabled until it
 * reads exactly 100, because the API refuses anything else: a Cookbook whose
 * enabled weights do not total 100 cannot produce a score, so it is rejected
 * before the write rather than stored and found unusable at scoring time. Showing
 * the running total is the difference between that rule being a guard rail and
 * being a rejection you meet after filling in a form.
 */
/* Author a Recipe that the catalogue does not ship.
 *
 * The two kinds are not interchangeable and the form says so, because the
 * difference decides whether the Recipe can score anything today:
 *
 *   human -- scored by the reviewer's 1-10 slider at analysis time. Needs no
 *            ingredients and no inference, so it works on meetings that are
 *            already extracted.
 *   ai    -- precomputed at EXTRACTION. A meeting extracted before this Recipe
 *            existed has no stored result for it, so it reads NOT_SCORABLE until
 *            that meeting is re-extracted. Saying so here is cheaper than letting
 *            somebody build a Cookbook that cannot publish and work out why.
 *
 * Ingredients come from the server rather than a list typed here: they are what
 * the pipeline demonstrably emits, and a typo would produce a Recipe that can
 * never be satisfied.
 */
function AuthorRecipeForm({ ingredients, pending, error, onAuthor, onDone }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [kind, setKind] = useState("human");
  const [needs, setNeeds] = useState([]);
  const ready =
    name.trim() && description.trim() && (kind === "human" || needs.length > 0);
  const toggleNeed = (ing) =>
    setNeeds((current) =>
      current.includes(ing)
        ? current.filter((i) => i !== ing)
        : [...current, ing],
    );
  return (
    <div className="author-recipe">
      <label className="field-label">
        Recipe name
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Were quieter people brought in"
        />
      </label>
      <label className="field-label">
        The question it asks
        <input
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What should a reviewer judge?"
        />
      </label>
      <label className="field-label">
        Scored by
        <select value={kind} onChange={(event) => setKind(event.target.value)}>
          <option value="human">
            A reviewer (1–10 slider) — works on existing meetings
          </option>
          <option value="ai">
            The pipeline — needs re-extraction before it scores
          </option>
        </select>
      </label>
      {kind === "ai" && (
        <>
          <div className="field-label">
            What a meeting must contain
            <div className="ingredient-grid">
              {ingredients.map((ing) => (
                <button
                  key={ing}
                  className={
                    needs.includes(ing) ? "ingredient on" : "ingredient"
                  }
                  onClick={() => toggleNeed(ing)}
                >
                  {ing}
                </button>
              ))}
            </div>
          </div>
          <p className="modal-note">
            A recipe scored by the pipeline is computed when a meeting is
            extracted. Meetings extracted before it exists have no result for it
            and will read “not scorable” until they are re-extracted.
          </p>
        </>
      )}
      {error && <p className="weight-error">{error.message}</p>}
      <div className="customizer-actions">
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button
          disabled={!ready || pending}
          onClick={() =>
            onAuthor({
              name: name.trim(),
              description: description.trim(),
              kind,
              required_ingredients: kind === "ai" ? needs : [],
            }).then(onDone)
          }
        >
          <Plus size={14} />
          {pending ? "Creating…" : "Create recipe"}
        </Button>
      </div>
    </div>
  );
}

function BuildCookbookModal({
  recipes,
  ingredients,
  loading,
  error,
  pending,
  onCancel,
  onCreate,
  onAuthor,
}) {
  const [name, setName] = useState("");
  const [authoring, setAuthoring] = useState(false);
  const [picked, setPicked] = useState({});          // recipe_id -> weight
  const chosen = Object.entries(picked).filter(([, w]) => Number(w) > 0);
  const total = chosen.reduce((sum, [, w]) => sum + Number(w), 0);
  const ready = name.trim() && chosen.length > 0 && total === 100;
  const toggle = (id) =>
    setPicked((current) => {
      const next = { ...current };
      if (id in next) delete next[id];
      else next[id] = 0;
      return next;
    });
  return (
    <Modal
      title="New Cookbook"
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button
            disabled={!ready || pending}
            onClick={() =>
              onCreate({
                name: name.trim(),
                recipes: chosen.map(([recipe_id, weight]) => ({
                  recipe_id,
                  weight: Number(weight),
                })),
              })
            }
          >
            <Plus size={14} />
            {pending ? "Creating…" : "Create Cookbook"}
          </Button>
        </>
      }
    >
      <label className="field-label">
        Cookbook name
        <input value={name} onChange={(e) => setName(e.target.value)} autoFocus />
      </label>
      <div className="build-total">
        <span>Enabled weight</span>
        <strong className={total === 100 ? "ok" : "bad"}>{total}%</strong>
        <em>
          {total === 100
            ? "Ready"
            : `must total 100 — ${total < 100 ? `${100 - total} short` : `${total - 100} over`}`}
        </em>
      </div>
      {/* Authoring sits INSIDE the build flow rather than on its own screen: the
          moment you discover the catalogue is missing your question is the moment
          you are choosing from it. A new Recipe lands in the list below, unticked,
          so adding one is still a deliberate choice. */}
      {authoring ? (
        <AuthorRecipeForm
          ingredients={ingredients}
          pending={pending}
          error={error}
          onAuthor={onAuthor}
          onDone={() => setAuthoring(false)}
        />
      ) : (
        <button className="recipe-add-row" onClick={() => setAuthoring(true)}>
          <Plus size={14} />
          None of these ask it? Write your own recipe
        </button>
      )}
      {loading ? (
        <LoadingCards />
      ) : (
        <div className="build-list">
          {recipes.map((recipe) => {
            const on = recipe.recipe_id in picked;
            return (
              <div className={on ? "build-row on" : "build-row"} key={recipe.recipe_id}>
                <label className="build-pick">
                  <input type="checkbox" checked={on} onChange={() => toggle(recipe.recipe_id)} />
                  <span>
                    <strong>{recipe.name}</strong>
                    {/* Polarity is a property of the QUESTION -- "Adversarial
                        Behaviour" measures an amount of something undesirable
                        however it is weighted -- so it is shown, not chosen. */}
                    <em>{recipe.polarity === "-" ? "risk" : "positive"} · {recipe.kind}</em>
                  </span>
                </label>
                {on && (
                  <input
                    className="build-weight"
                    type="number"
                    min="0"
                    max="100"
                    value={picked[recipe.recipe_id]}
                    aria-label={`Weight for ${recipe.name}`}
                    onChange={(e) =>
                      setPicked((c) => ({ ...c, [recipe.recipe_id]: e.target.value }))
                    }
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
      {error && (
        <div className="warning-callout" role="alert">
          <p>{error.message}</p>
        </div>
      )}
    </Modal>
  );
}
