/**
 * ScannerFeedback - Feedback visual e sonoro para leitura de código de barras.
 *
 * Fornece:
 *  - Sons distintos (leitura bem-sucedida, produto não encontrado, código inválido)
 *    usando Web Audio API (sintese leve, sem arquivos de áudio externos).
 *  - Indicação visual do estado do scanner:
 *      aguardando -> processando -> identificado / erro
 *  - Exibição de mensagens de produto encontrado / não encontrado / código inválido / erro de comunicação.
 *
 * Não bloqueia a utilização do sistema (sons assíncronos e curtos).
 */

class ScannerFeedback {
  constructor(options = {}) {
    const defaults = {
      containerSelector: '#scanner-feedback-container',
      ativo: true,
      volume: 0.15,
    };
    this.config = { ...defaults, ...options };
    this.audioCtx = null;
    this._container = null;
    this._inicializarAudio();
  }

  /* ========================================================================
     ÁUDIO (Web Audio API)
     ======================================================================== */

  _inicializarAudio() {
    if (!this.config.ativo) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      this.audioCtx = new AudioContext();
    }
  }

  _garantirContextoAudio() {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  _tocar(frequencia, duracao, tipo = 'sine', delay = 0) {
    if (!this.config.ativo || !this.audioCtx) return;
    this._garantirContextoAudio();
    const t = this.audioCtx.currentTime + delay;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frequencia, t);
    gain.gain.setValueAtTime(this.config.volume, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duracao);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start(t);
    osc.stop(t + duracao);
  }

  /**
   * Som de leitura bem-sucedida (dois tons ascendentes, agradável).
   */
  somSucesso() {
    this._tocar(800, 0.10);
    this._tocar(1100, 0.10, 'sine', 0.08);
  }

  /**
   * Som de produto não encontrado (tom grave,Descendente).
   */
  somNaoEncontrado() {
    this._tocar(300, 0.18);
    this._tocar(220, 0.18, 'sine', 0.10);
  }

  /**
   * Som de código inválido (tons alternados, alerta).
   */
  somInvalido() {
    this._tocar(600, 0.08);
    this._tocar(500, 0.08, 'sine', 0.10);
    this._tocar(600, 0.08, 'sine', 0.18);
  }

  /**
   * Som de erro de comunicação (tom baixo prolongado).
   */
  somErroComunicacao() {
    this._tocar(180, 0.30, 'sawtooth');
  }

  /* ========================================================================
     INDICAÇÃO VISUAL DO ESTADO
     ======================================================================== */

  _obterContainer() {
    if (!this._container) {
      this._container = document.querySelector(this.config.containerSelector);
      if (!this._container) {
        this._criarContainer();
      }
    }
    return this._container;
  }

  _criarContainer() {
    const container = document.createElement('div');
    container.id = 'scanner-feedback-container';
    container.className = 'scanner-feedback d-flex align-items-center gap-2 p-3 rounded-3 border';
    container.style.position = 'fixed';
    container.style.top = '1rem';
    container.style.right = '1rem';
    container.style.zIndex = '1090';
    container.style.display = 'none';
    container.innerHTML = `
      <div class="scanner-indicator" id="scanner-indicator-dot"></div>
      <div class="scanner-texto">
        <div id="scanner-feedback-titulo" class="fw-semibold small"></div>
        <div id="scanner-feedback-mensagem" class="small opacity-80"></div>
      </div>
    `;
    // Estilos embutidos para garantir funcionamento sem depender do style.css
    const estilo = document.createElement('style');
    estilo.textContent = `
      #scanner-feedback-container {
        min-width: 260px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.12);
      }
      #scanner-indicator-dot {
        width: 12px; height: 12px; border-radius: 50%;
        background: var(--texto-secundario, #6b7280);
        box-shadow: 0 0 0 rgba(0,0,0,0);
        animation: scannerPulse 2s infinite;
      }
      @keyframes scannerPulse {
        0% { box-shadow: 0 0 0 0 rgba(107,114,128,0.4); }
        70% { box-shadow: 0 0 0 6px rgba(107,114,128,0); }
        100% { box-shadow: 0 0 0 0 rgba(107,114,128,0); }
      }
      #scanner-indicator-dot.estado-agurdando { background: #6b7280; }
      #scanner-indicator-dot.estado-processando { background: #0d6efd; animation: scannerPulse 1s infinite; }
      #scanner-indicator-dot.estado-identificado { background: #198754; animation: none; }
      #scanner-indicator-dot.estado-erro { background: #dc3545; animation: scannerPulse 0.5s infinite; }
    `;
    document.head.appendChild(estilo);
    document.body.appendChild(container);
  }

  _setEstado(estado) {
    const container = this._obterContainer();
    const dot = container.querySelector('#scanner-indicator-dot');
    container.classList.remove(
      'estado-agurdando', 'estado-processando', 'estado-identificado', 'estado-erro'
    );
    if (dot) {
      dot.classList.remove(
        'estado-agurdando', 'estado-processando', 'estado-identificado', 'estado-erro'
      );
    }
    const classe = 'estado-' + estado;
    container.classList.add(classe);
    if (dot) dot.classList.add(classe);
  }

  _setMensagem(titulo, mensagem) {
    const container = this._obterContainer();
    const elTitulo = container.querySelector('#scanner-feedback-titulo');
    const elMensagem = container.querySelector('#scanner-feedback-mensagem');
    if (elTitulo) elTitulo.textContent = titulo || '';
    if (elMensagem) elMensagem.textContent = mensagem || '';
    container.style.display = 'flex';
  }

  _esconder() {
    const container = this._obterContainer();
    container.style.display = 'none';
  }

  /* ========================================================================
     MÉTODOS DE FEEDBACK PÚBLICOS
     ======================================================================== */

  /**
   * Estado: aguardando leitura.
   */
  aguardando() {
    this._setEstado('agurdando');
    this._setMensagem('Scanner', 'Aguardando leitura de código de barras...');
  }

  /**
   * Estado: processando uma leitura.
   */
  processando() {
    this._setEstado('processando');
    this._setMensagem('Processando', 'Lendo código de barras...');
  }

  /**
   * Produto encontrado com sucesso.
   * @param {Object} produto { nome, descricao, codigo_barras, estoque, tipo }
   */
  produtoEncontrado(produto = {}) {
    this.somSucesso();
    this._setEstado('identificado');
    this._setMensagem(
      'Produto identificado',
      `${produto.nome || 'Produto'} — ${produto.codigo_barras || ''}${
        produto.estoque !== undefined ? ` (Estoque: ${produto.estoque})` : ''
      }`
    );
    // Esconder automaticamente após 3s
    setTimeout(() => this._esconder(), 3000);
  }

  /**
   * Produto não encontrado.
   * @param {string} codigo Código lido
   */
  produtoNaoEncontrado(codigo = '') {
    this.somNaoEncontrado();
    this._setEstado('erro');
    this._setMensagem(
      'Produto não encontrado',
      `O código "${escapeHtmlGlobal(codigo)}" não está cadastrado. Verifique e tente novamente.`
    );
    setTimeout(() => this._esconder(), 4000);
  }

  /**
   * Código inválido (não passou na validação de formato).
   * @param {string} codigo Código lido
   */
  codigoInvalido(codigo = '') {
    this.somInvalido();
    this._setEstado('erro');
    this._setMensagem(
      'Código inválido',
      `O código "${escapeHtmlGlobal(codigo)}" não passou na validação.`
    );
    setTimeout(() => this._esconder(), 3000);
  }

  /**
   * Erro de comunicação com o servidor.
   */
  erroComunicacao() {
    this.somErroComunicacao();
    this._setEstado('erro');
    this._setMensagem(
      'Erro de comunicação',
      'O servidor não respondeu. Verifique a conexão e tente novamente.'
    );
    setTimeout(() => this._esconder(), 5000);
  }

  /**
   * Esconder feedback visual.
   */
  esconder() {
    this._esconder();
  }
}

/**
 * Escape HTML global (reutiliza window.escapeHtml se disponível).
 */
function escapeHtmlGlobal(texto) {
  if (typeof window.escapeHtml === 'function') return window.escapeHtml(texto);
  if (texto == null) return '';
  const div = document.createElement('div');
  div.textContent = String(texto);
  return div.innerHTML;
}
