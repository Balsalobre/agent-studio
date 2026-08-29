/* graph.jsx — temporal force-directed onboarding map (D3). Click a node → chat. */
const { useRef: useRefGr, useEffect: useEffectGr } = React;

function ContentGraph({ onPick }) {
  const wrapRef = useRefGr(null);
  const svgRef = useRefGr(null);
  const onPickRef = useRefGr(onPick);
  onPickRef.current = onPick;

  useEffectGr(() => {
    const d3 = window.d3;
    if (!d3 || !svgRef.current || !wrapRef.current) return;
    const wrap = wrapRef.current;
    let W = wrap.clientWidth || 800, H = wrap.clientHeight || 480;

    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${W} ${H}`);
    svg.selectAll("*").remove();
    const linkG = svg.append("g");
    const nodeG = svg.append("g");

    const R = { root: 30, area: 16, lesson: 9 };
    const allNodes = GRAPH.nodes.map(n => ({ ...n, r: R[n.level] }));
    const byId = Object.fromEntries(allNodes.map(n => [n.id, n]));
    const parentOf = {};
    GRAPH.links.forEach(([s, t]) => { parentOf[t] = s; });
    const allLinks = GRAPH.links.map(([s, t]) => ({ source: s, target: t }));
    allNodes.forEach(n => { n.x = W / 2 + (Math.random() - .5) * 30; n.y = H / 2 + (Math.random() - .5) * 30; });

    const sim = d3.forceSimulation()
      .force("link", d3.forceLink().id(d => d.id).distance(l => (l.target.level === "lesson" ? 66 : 120)).strength(.65))
      .force("charge", d3.forceManyBody().strength(d => d.level === "root" ? -560 : d.level === "area" ? -360 : -150))
      .force("center", d3.forceCenter(W / 2, H / 2 + 22).strength(.05))
      .force("collide", d3.forceCollide().radius(d => d.r + 16))
      .force("x", d3.forceX(W / 2).strength(.018))
      .force("y", d3.forceY(H / 2 + 22).strength(.045))
      .on("tick", ticked);

    let linkSel = linkG.selectAll("line");
    let nodeSel = nodeG.selectAll("g.gnode");
    let hoveredId = null;

    const tip = d3.select(wrap).append("div").attr("class", "graph-tip");

    const drag = d3.drag()
      .on("start", (e, d) => { if (!e.active) sim.alphaTarget(.25).restart(); d.fx = d.x; d.fy = d.y; })
      .on("drag", (e, d) => { d.fx = e.x; d.fy = e.y; })
      .on("end", (e, d) => { if (!e.active) sim.alphaTarget(0); d.fx = null; d.fy = null; });

    function update(maxWave) {
      const nodes = allNodes.filter(n => n.wave <= maxWave);
      const ids = new Set(nodes.map(n => n.id));
      // seed newly-revealed nodes near their parent for a nice grow-out
      nodes.forEach(n => {
        if (n._seeded) return; n._seeded = true;
        const p = byId[parentOf[n.id]];
        if (p) { n.x = p.x + (Math.random() - .5) * 24; n.y = p.y + (Math.random() - .5) * 24; }
      });
      const links = allLinks.filter(l =>
        ids.has(typeof l.source === "object" ? l.source.id : l.source) &&
        ids.has(typeof l.target === "object" ? l.target.id : l.target));

      sim.nodes(nodes);
      sim.force("link").links(links);

      linkSel = linkSel.data(links, d => (d.source.id || d.source) + "→" + (d.target.id || d.target));
      linkSel.exit().remove();
      linkSel = linkSel.enter().append("line")
        .attr("class", "glink")
        .attr("stroke-width", d => ((d.source.id || d.source) === "root" ? 1.4 : 1))
        .merge(linkSel);

      nodeSel = nodeSel.data(nodes, d => d.id);
      nodeSel.exit().remove();
      const enter = nodeSel.enter().append("g")
        .attr("class", d => `gnode lvl-${d.level} n-${d.status}`)
        .call(drag)
        .on("click", (e, d) => { if (d.status !== "locked" && onPickRef.current) onPickRef.current(d); })
        .on("mouseenter", (e, d) => { hoveredId = d.id; tip.html(`<b>${d.label}</b><i>${d.desc || ""}</i>`).classed("on", true); placeTip(d); })
        .on("mouseleave", () => { hoveredId = null; tip.classed("on", false); });
      enter.append("circle").attr("class", "halo").attr("r", d => d.r + 6);
      enter.append("circle").attr("class", "dot").attr("r", d => d.r);
      enter.append("text").attr("class", "lbl").attr("text-anchor", "middle")
        .attr("dy", d => d.r + 14).text(d => d.label);
      nodeSel = enter.merge(nodeSel);

      // settle synchronously so layout is correct even if rAF timers are throttled
      sim.alpha(.9);
      for (let i = 0; i < 160; i++) sim.tick();
      ticked();
      sim.alphaTarget(0).alpha(.5).restart();
    }

    function placeTip(d) { tip.style("left", d.x + "px").style("top", (d.y - d.r - 12) + "px"); }

    function ticked() {
      allNodes.forEach(n => {
        n.x = Math.max(n.r + 10, Math.min(W - n.r - 10, n.x));
        n.y = Math.max(n.r + 96, Math.min(H - n.r - 18, n.y));
      });
      linkSel.attr("x1", d => d.source.x).attr("y1", d => d.source.y).attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      nodeSel.attr("transform", d => `translate(${d.x},${d.y})`);
      if (hoveredId && byId[hoveredId]) placeTip(byId[hoveredId]);
    }

    const maxWave = Math.max(...allNodes.map(n => n.wave));
    let wave = 0;
    update(0);
    const iv = setInterval(() => { wave += 1; update(wave); if (wave >= maxWave) clearInterval(iv); }, 700);

    const ro = new ResizeObserver(() => {
      W = wrap.clientWidth; H = wrap.clientHeight;
      svg.attr("viewBox", `0 0 ${W} ${H}`);
      sim.force("center", d3.forceCenter(W / 2, H / 2 + 22).strength(.05));
      sim.force("x", d3.forceX(W / 2).strength(.018));
      sim.force("y", d3.forceY(H / 2 + 22).strength(.045));
      sim.alpha(.4).restart();
    });
    ro.observe(wrap);

    return () => { clearInterval(iv); sim.stop(); ro.disconnect(); tip.remove(); };
  }, []);

  return (
    <div className="graph-stage" ref={wrapRef}>
      <div className="graph-head">
        <div>
          <div className="kicker">Mapa de tu onboarding</div>
          <div className="graph-title">Toca un nodo y Bonsai te lo explica</div>
        </div>
        <div className="graph-legend">
          <span><i className="lg done" /> Completado</span>
          <span><i className="lg current" /> En curso</span>
          <span><i className="lg pending" /> Pendiente</span>
          <span><i className="lg locked" /> Bloqueado</span>
        </div>
      </div>
      <svg ref={svgRef} className="graph-svg"></svg>
    </div>
  );
}

Object.assign(window, { ContentGraph });
