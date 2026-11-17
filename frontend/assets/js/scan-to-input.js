/**
 * ScanToInput - Plugin de leitura de código de barras via scanner USB/Bluetooth HID.
 *
 * O scanner HID se comporta como um teclado: "digita" os caracteres do código
 * rapidamente e, geralmente, envia um Enter (ou Tab) ao final da leitura.
 *
 * Este plugin:
 *  - Acumula caracteres digitados rapidamente (leituras rápidas).
 *  - Detecta o Enter enviado pelo scanner como gatilho de leitura completa.
 *  - Usa um timeout de inatividade para finalizar leituras sem Enter.
 *  - Ignora digitação em campos interativos (inputs, selects, textareas)
 *    para não interferir na entrada manual do usuário.
 *  - Impede leituras duplicadas consecutivas.
 *  - Controla requisições simultâneas (uma leitura por vez).
 *  - Expõe métodos iniciar(), pausar() e encerrar().
 *  - Notifica estados via callbacks: aguardando, processando, identificado, erro.
 *
 * Mantido em JavaScript puro, sem dependências externas.
 */

class ScanToInput {
  constructor(options = {}) {
    const defaults = {
      scanThreshold: 50,          // ms entre caracteres para qualificar como scan (leitura rápida)
      minLength: 4,               // ignorar leituras curtas acidentais
      inputSelector: '[data-scan-box]', // seletor do campo alvo da leitura
      clearButtonSelector: '[data-scan-remove]',
      mode: 'overwrite',          // 'overwrite' preenche o primeiro; 'append' preenche o primeiro vazio
      onScan: null,               // callback(code, target, tipo) após leitura válida
      validation: null,           // função opcional(value) => boolean
      duplicateTimeout: 1500,     // ms para considerar leitura duplicada do mesmo código
      busyTimeout: 3000,          // ms máximo aguardando processamento antes de liberar
    };

    this.config = { ...defaults, ...options };

    // Estado de leitura
    this.buffer = '';
    this.lastCharTime = 0;
    this.scanTimeout = null;

    // Estado de controle
    this.ativo = true;            // captura habilitada?
    this.pausado = false;         // pausa temporária
    this.processando = false;     // uma leitura está sendo processada?
    this.ultimoCodigoProcessado = ''; // último código processado (anti-duplicata)
    this.ultimoCodigoTime = 0;
    this.requisicaoEmAndamento = false; // controle de requisição simultânea

    // Callbacks de estado visual
    this.onEstado = null;         // callback(estado) onde estado ∈ {'aguardando','processando','identificado','erro'}

    this._bindHandlers();
    this.scanToInputInit();
  }

  /* ========================================================================
     INICIALIZAÇÃO E CICLO DE VIDA
     ======================================================================== */

  scanToInputInit() {
    // Captura global de teclado
    document.addEventListener('keydown', (e) => this.scanToInputHandleKeydown(e));

    // Botões de limpar campo de scan
    document.querySelectorAll(this.config.clearButtonSelector).forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = btn.closest('.input-group')
          ?.querySelector(this.config.inputSelector);
        if (input) {
          input.value = '';
          input.classList.remove('is-valid', 'is-invalid');
        }
        this.buffer = '';
        this._notificarEstado('aguardando');
      });
    });

    this._notificarEstado('aguardando');
  }

  /**
   * Habilita a captura do scanner.
   */
  iniciar() {
    this.ativo = true;
    this.pausado = false;
    this.processando = false;
    this.buffer = '';
    this._notificarEstado('aguardando');
  }

  /**
   * Pausa temporariamente a captura (não reseta estado de processamento).
   */
  pausar() {
    this.pausado = true;
    clearTimeout(this.scanTimeout);
    this.buffer = '';
    this._notificarEstado('aguardando');
  }

  /**
   * Encerra a captura completamente. Remove o listener de teclado.
   */
  encerrar() {
    document.removeEventListener('keydown', this._keydownHandler);
    clearTimeout(this.scanTimeout);
    this.ativo = false;
    this.pausado = true;
    this.processando = false;
    this.buffer = '';
    this._notificarEstado('aguardando');
  }

  /* ========================================================================
     CONTROLE DE FOCO E CAMPOS INTERATIVOS
     ======================================================================== */

  /**
   * Verifica se o elemento com foco é um campo interativo onde o usuário
   * está digitando manualmente (input, select, textarea, contenteditable).
   * Nesses casos o scanner não deve interceptar a digitação.
   */
  _isCampoInterativoFocado(eventTarget) {
    if (!eventTarget) return false;
    const tag = eventTarget.tagName ? eventTarget.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return true;
    if (eventTarget.isContentEditable) return true;
    return false;
  }

  /* ========================================================================
     MANIPULAÇÃO DE TECLADO
     ======================================================================== */

  _bindHandlers() {
    this._keydownHandler = (e) => this.scanToInputHandleKeydown(e);
    document.addEventListener('keydown', this._keydownHandler);
  }

  scanToInputHandleKeydown(event) {
    // Se captura desabilitada ou pausada, não intercepta nada.
    if (!this.ativo || this.pausado) return;

    // Não interfere na digitação manual em campos interativos.
    if (this._isCampoInterativoFocado(event.target)) {
      // Limpa buffer se o usuário estiver digitando manualmente em um campo,
      // evitando que caracteres digitados à mão sejam acumulados como scan.
      this.buffer = '';
      clearTimeout(this.scanTimeout);
      return;
    }

    const now = Date.now();
    const char = event.key;

    // ---------------------------------------------------------------
    // Enter do scanner: finaliza a leitura e processa o código acumulado.
    // ---------------------------------------------------------------
    if (char === 'Enter') {
      if (this.buffer.length >= this.config.minLength) {
        clearTimeout(this.scanTimeout);
        this._processarLeitura(this.buffer);
      }
      this.buffer = '';
      this.lastCharTime = now;
      event.preventDefault();
      return;
    }

    // Tab também pode ser usado como finalizador por alguns leitores.
    if (char === 'Tab') {
      if (this.buffer.length >= this.config.minLength) {
        clearTimeout(this.scanTimeout);
        this._processarLeitura(this.buffer);
      }
      this.buffer = '';
      this.lastCharTime = now;
      event.preventDefault();
      return;
    }

    // Caracteres alfanuméricos e símbolos comuns de código de barras.
    if (char.length === 1 && /^[\w\d\-.\/]+$/i.test(char)) {
      const isFast = now - this.lastCharTime < this.config.scanThreshold;
      this.lastCharTime = now;

      // Início de uma nova leitura ou continuação rápida.
      if (isFast || this.buffer.length === 0) {
        this.buffer += char;
        clearTimeout(this.scanTimeout);

        // Timeout de inatividade: finaliza a leitura se parar de receber chars.
        this.scanTimeout = setTimeout(() => {
          if (this.buffer.length >= this.config.minLength) {
            this._processarLeitura(this.buffer);
          }
          this.buffer = '';
        }, this.config.scanThreshold * 3);
      } else {
        // Caracter digitado devagar após já haver buffer: descarta (não é scan).
        this.buffer = char;
      }
    }
  }

  /* ========================================================================
     PROCESSAMENTO DA LEITURA
     ======================================================================== */

  /**
   * Processa um código lido pelo scanner.
   * Aplica validação, anti-duplicata, controle de requisição simultânea,
   * preenchimento do campo alvo e disparo do callback onScan.
   */
  _processarLeitura(code) {
    const codeLimpo = String(code).trim();

    if (!codeLimpo || codeLimpo.length < this.config.minLength) {
      this.buffer = '';
      this._notificarEstado('aguardando');
      return;
    }

    // Validação opcional (formato de código de barras).
    if (typeof this.config.validation === 'function' && !this.config.validation(codeLimpo)) {
      this.buffer = '';
      this._notificarEstado('erro');
      return;
    }

    // Anti-leitura duplicada: mesmo código lido em curto intervalo é ignorado.
    const agora = Date.now();
    if (
      codeLimpo === this.ultimoCodigoProcessado &&
      agora - this.ultimoCodigoTime < this.config.duplicateTimeout
    ) {
      this.buffer = '';
      this._notificarEstado('aguardando');
      return;
    }

    // Controle de requisição simultânea: se já está processando, ignora.
    if (this.processando || this.requisicaoEmAndamento) {
      this.buffer = '';
      this._notificarEstado('processando');
      return;
    }

    // Marca como processando e registra o código para anti-duplicata.
    this.processando = true;
    this.requisicaoEmAndamento = true;
    this.ultimoCodigoProcessado = codeLimpo;
    this.ultimoCodigoTime = agora;
    this._notificarEstado('processando');

    // Preencher campo alvo (se houver).
    const inputs = Array.from(document.querySelectorAll(this.config.inputSelector));
    let target = null;
    if (this.config.mode === 'overwrite') {
      target = inputs[0];
    } else {
      target = inputs.find((el) => !el.value);
    }
    if (target) {
      target.value = codeLimpo;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.classList.add('is-valid');
    }

    // Disparar callback de leitura concluída.
    if (typeof this.config.onScan === 'function') {
      try {
        this.config.onScan(codeLimpo, target);
      } catch (err) {
        console.error('Erro no callback onScan do ScanToInput:', err);
        this._notificarEstado('erro');
      }
    }

    // Liberar após o busyTimeout (segurança contra travamento permanente).
    setTimeout(() => {
      this.processando = false;
      this.requisicaoEmAndamento = false;
      this._notificarEstado('aguardando');
    }, this.config.busyTimeout);

    this.buffer = '';
  }

  /**
   * Notifica mudança de estado do scanner via callback.
   * Estados: 'aguardando', 'processando', 'identificado', 'erro'.
   */
  _notificarEstado(estado) {
    if (typeof this.config.onEstado === 'function') {
      try {
        this.config.onEstado(estado);
      } catch (err) {
        console.error('Erro no callback onEstado do ScanToInput:', err);
      }
    }
  }

  /**
   * Marca a leitura atual como concluída com sucesso (chamado pelo caller
   * quando o backend confirma o produto). Atualiza indicadores visuais.
   */
  marcarIdentificado() {
    this.processando = false;
    this.requisicaoEmAndamento = false;
    this._notificarEstado('identificado');
    // Limpa indicação de erro/validez após pequeno delay
    setTimeout(() => {
      this._notificarEstado('aguardando');
    }, 1200);
  }

  /**
   * Marca a leitura atual como erro (código inválido ou produto não encontrado).
   */
  marcarErro() {
    this.processando = false;
    this.requisicaoEmAndamento = false;
    this._notificarEstado('erro');
    setTimeout(() => {
      this._notificarEstado('aguardando');
    }, 1200);
  }
}
