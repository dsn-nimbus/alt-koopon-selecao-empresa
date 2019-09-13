describe('alt.koopon.selecao-empresa', function() {
  var _rootScope, _scope, _http, _q, _httpBackend, _locationMock, _xtorage,
      _AltKooponEmpresaService, _AltAlertaFlutuanteService, _AltPassaporteUsuarioLogadoManager,
      _AltPassaporteProcuracaoService, _AltModalService, _EventoEmpresa, _assinanteKoopon;

  var ID_STATUS_BIMER_PLENO_ATENDIMENTO, ID_MODAL_EMPRESA_INADIMPLENCIA, ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA;
  var URL_PASSAPORTE = 'https://passaporte2.alterdata.com.br/minha-api/';
  var CHAVE_PRODUTO = 'abc123';
  var URL_BASE = '/koopon-contador-rest-api/assinantes/selecao';

  beforeEach(module('alt.koopon.selecao-empresa', function(AltKoopon_BASE_APIProvider, AltKooponSelecaoEmpresaPassaporteUrlBaseProvider, AltKooponSelecaoEmpresaChaveProdutoProvider) {
    AltKoopon_BASE_APIProvider.url = '/koopon-contador-rest-api/';
    AltKooponSelecaoEmpresaPassaporteUrlBaseProvider.url = URL_PASSAPORTE;
    AltKooponSelecaoEmpresaChaveProdutoProvider.chave = CHAVE_PRODUTO;
  }));

  beforeEach(inject(function($injector) {
    _rootScope = $injector.get('$rootScope');
    _scope = _rootScope.$new();
    _q = $injector.get('$q');
    _http = $injector.get('$http');
    _httpBackend = $injector.get('$httpBackend');
    _xtorage = $injector.get('$xtorage');

    _locationMock = $injector.get('$location');

    ID_STATUS_BIMER_PLENO_ATENDIMENTO = $injector.get('ID_STATUS_BIMER_PLENO_ATENDIMENTO');
    ID_MODAL_EMPRESA_INADIMPLENCIA = $injector.get('ID_MODAL_EMPRESA_INADIMPLENCIA');
    ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA = $injector.get('ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA');

    _AltPassaporteUsuarioLogadoManager = $injector.get('AltPassaporteUsuarioLogadoManager');
    _EventoEmpresa = $injector.get('AltKooponEventoEmpresa');

    _AltAlertaFlutuanteService = $injector.get('AltAlertaFlutuanteService');
    _AltKooponEmpresaService = $injector.get('AltKooponEmpresaService');
    _AltPassaporteProcuracaoService = $injector.get('AltPassaporteProcuracaoService');
    _AltKooponSelecaoEmpresasHelper = $injector.get('AltKooponSelecaoEmpresasHelper');
    _AltModalService = $injector.get('AltModalService');

    spyOn(_AltAlertaFlutuanteService, 'exibe').and.callFake(angular.noop);

    spyOn(_xtorage, 'save').and.callFake(angular.noop);
    spyOn(_xtorage, 'get').and.callFake(angular.noop);

    spyOn(_rootScope, '$broadcast').and.callThrough();

    _assinanteKoopon = {
      descricaoStatus: 'Pleno Atendimento',
      codigoCrm: '438694',
      idAssinante: 3111,
      idStatusCrm: '0010000001',
      idProdutoStatus: 18,
      inadimplenteCrm: false
    };
    _assinanteKooponInadimplente = {
      descricaoStatus: 'Pleno Atendimento',
      codigoCrm: '438694',
      idAssinante: 3111,
      idStatusCrm: '0010000001',
      idProdutoStatus: 18,
      inadimplenteCrm: true
    };
    _assinanteKooponNaoPleno = {
      descricaoStatus: 'Não Pleno Atendimento',
      codigoCrm: '438694',
      idAssinante: 3111,
      idStatusCrm: '999',
      idProdutoStatus: 18,
      inadimplenteCrm: true
    };
  }));

  describe('constantes', function() {
    it('deve ter os valores corretos para as constantes', function() {
      expect(ID_STATUS_BIMER_PLENO_ATENDIMENTO).toBe('0010000001');
      expect(ID_MODAL_EMPRESA_INADIMPLENCIA).toBe('#alt-koopon-selecao-empresa-modal-inadimplencia');
      expect(ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA).toBe('#alt-koopon-selecao-empresa-modal-demonstracao-expirada');
    });
  });

  describe('interceptor', function() {
    var URL = '/api/qqcoisa';

    describe('seleção empresa', function() {
      it('não deve redirecionar, resposta ok - não deve chamar troca de rota', function() {
        spyOn(_locationMock, 'path').and.returnValue('/');

        _httpBackend.expectGET(URL).respond(200);

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).not.toHaveBeenCalled();
        expect(_rootScope.$broadcast).not.toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });

      it('deve retornar uma promessa com a rejeição do servidor - 400 - não deve chamar troca de rota', function() {
        spyOn(_locationMock, 'path').and.returnValue('/');

        _httpBackend.expectGET(URL).respond(400);

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).not.toHaveBeenCalledWith('/selecao-empresas');
        expect(_rootScope.$broadcast).not.toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });

      it('deve retornar uma promessa com a rejeição do servidor - 403 - não deve chamar troca de rota', function() {
        spyOn(_locationMock, 'path').and.returnValue('/');

        _httpBackend.expectGET(URL).respond(403, {deveSelecionarEmpresa: false});

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).not.toHaveBeenCalledWith('/selecao-empresas');
        expect(_rootScope.$broadcast).not.toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });

      it('deve retornar uma promessa com a rejeição do servidor - 403 - deve e não chamar troca de rota, url contém wizard', function() {
        spyOn(_locationMock, 'path').and.returnValue('/abc/wizard');

        _httpBackend.expectGET(URL).respond(403, {deveSelecionarEmpresa: true});

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).not.toHaveBeenCalledWith('/selecao-empresas');
        expect(_rootScope.$broadcast).not.toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });

      it('deve retornar uma promessa com a rejeição do servidor - 403 - deve chamar troca de rota', function() {
        spyOn(_locationMock, 'path').and.returnValue('/');

        _httpBackend.expectGET(URL).respond(403, {deveSelecionarEmpresa: true});

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).toHaveBeenCalledWith('/selecao-empresas');
        expect(_rootScope.$broadcast).toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });
    });
  });

  describe('service', function() {
    beforeEach(function() {
        spyOn(_locationMock, 'path').and.returnValue('/');
    });

    describe('criação', function() {
      it('deve ter o service como um objeto', function() {
        expect(typeof _AltKooponEmpresaService).toBe('object');
      });
    });

    describe('getEmpresas', function() {
      it('deve chamar o método correto', function() {
        var _empreas = [1, 2, 3];

        spyOn(_AltPassaporteUsuarioLogadoManager, 'retorna').and.returnValue({
          assinantes: _empreas
        });

        expect(_AltKooponEmpresaService.getEmpresas()).toEqual(_empreas);
      });

      it('deve chamar o método correto', function() {
        var _empreas = [1, 2, 3];

        spyOn(_AltPassaporteUsuarioLogadoManager, 'retorna').and.returnValue({
          'outro-nome': _empreas
        });

        expect(_AltKooponEmpresaService.getEmpresas('outro-nome')).toEqual(_empreas);
      });
    });

    describe('getEmpresaEscolhidaDaStorage', function() {
      it('deve chamar o método com os parâmetros corretos', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.getEmpresaEscolhidaDaStorage();

        expect(_xtorage.get).toHaveBeenCalledWith('emp_escolhida');
      });

      it('deve chamar o método com os parâmetros corretos - chave diferente', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.getEmpresaEscolhidaDaStorage('abc');

        expect(_xtorage.get).toHaveBeenCalledWith('abc');
      });
    });

    describe('salvaNaStorageEmpresaEscolhida', function() {
      it('deve chamar o método com os parâmetros corretos', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(_emp);

        expect(_xtorage.save).toHaveBeenCalledWith('emp_escolhida', _emp);
      });

      it('deve chamar o método com os parâmetros corretos - chave diferente', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(_emp, 'abc');

        expect(_xtorage.save).toHaveBeenCalledWith('abc', _emp);
      });
    });

    describe('escolhe', function() {
      it('não deve chamar o endpoint, empresa passada não é válida - undefined', function() {
        var _empresa = undefined;

        _AltKooponEmpresaService
        .escolhe(_empresa)
        .then(function(){expect(true).toBe(false)})
        .catch(function(erro) {
          expect(erro).toBeDefined();
          expect(erro instanceof TypeError).toBeDefined();
          expect(erro.message).toEqual('Empresa deve ser informada para ser passada ao servidor.');
          expect(_rootScope.$broadcast).not.toHaveBeenCalled();
        })
      });

      it('não deve chamar o endpoint, empresa passada não é válida - objeto vazio', function() {
        var _empresa = {};

        _AltKooponEmpresaService
        .escolhe(_empresa)
        .then(function(){expect(true).toBe(false)})
        .catch(function(erro) {
          expect(erro).toBeDefined();
          expect(erro instanceof TypeError).toBeDefined();
          expect(erro.message).toEqual('Empresa deve ser informada para ser passada ao servidor.');
          expect(_rootScope.$broadcast).not.toHaveBeenCalled();
        })
      });

      it('deve tentar chamar o endpoint, mas o mesmo retorna erro - 400', function() {
        var _empresa = {id: 1, qqcoisa: true};

        _httpBackend.expectPOST(URL_BASE, {empresaEscolhida: _empresa.id}).respond(400);

        _AltKooponEmpresaService
        .escolhe(_empresa)
        .then(function(){expect(true).toBe(false)})
        .catch(function(erro) {
          expect(erro).toBeDefined();
        });

        _httpBackend.flush();
        expect(_rootScope.$broadcast).not.toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_NAO_CONFIGURADA);
      });

      it('deve chamar o endpoint corretamente e o passaporte deve retornar a empresa por id e chaveProduto', function() {
        var _empresa = {id: 1, qqcoisa: true};
        var _usuarioComEmpresaCompletaVindaDoPassaporte = {
          nomUsuario: 'xxx', 
          assinantes: [
            {
              id: 1,
              qqcoisa: true,
              outraCoisa: false,
              produtos: [{a: 1}, {a: 2}, {a: 3}]
            }
          ]
        };

        _httpBackend.expectPOST(URL_BASE, {empresaEscolhida: _empresa.id}).respond(200, _usuarioComEmpresaCompletaVindaDoPassaporte);

        _AltKooponEmpresaService
        .escolhe(_empresa)
        .then(function(emp) {
          expect(emp.id).toBe(_usuarioComEmpresaCompletaVindaDoPassaporte.assinantes[0].id);
          expect(emp.qqcoisa).toBe(_usuarioComEmpresaCompletaVindaDoPassaporte.assinantes[0].qqcoisa);
          expect(emp.outraCoisa).toBe(_usuarioComEmpresaCompletaVindaDoPassaporte.assinantes[0].outraCoisa);
          expect(emp.produtos.length).toEqual(_usuarioComEmpresaCompletaVindaDoPassaporte.assinantes[0].produtos.length);
        })
        .catch(function(){expect(true).toBe(false)});

        _httpBackend.flush();

        expect(_rootScope.$broadcast).toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA, _usuarioComEmpresaCompletaVindaDoPassaporte.assinantes[0]);
      });
    });
  });

    describe('controller', function() {
      beforeEach(function() {
          spyOn(_locationMock, 'path').and.returnValue('/');
      });

      var NOME_CONTROLLER = 'AltKooponSelecaoEmpresasController as ctrl';

      describe('criação', function() {
        it('deve criar a controller corretamente', inject(function($controller) {
          $controller(NOME_CONTROLLER, {$scope: _scope});
        }));

        it('deve ter empresas como um array vazio', inject(function($controller) {
          $controller(NOME_CONTROLLER, {$scope: _scope});

          expect(_scope.ctrl.empresas).toEqual([]);
        }));
      });

      describe('init', function() {
        it('deve tentar buscar as empresas, mas o serviço retorna undefined', inject(function ($controller) {
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(undefined);

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.ctrl.init();

          expect(_scope.ctrl.empresas).toEqual([]);
        }));

        it('deve buscar as empresas corretamente, duas são preenchidas', inject(function ($controller) {
          var _empresas = [{id: 1, nome: 'a'}, {id: 2, nome: 'b'}];

          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresas);

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.ctrl.init();

          expect(_scope.ctrl.empresas).toEqual(_empresas);
          expect(_locationMock.path).not.toHaveBeenCalled();
        }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', inject(function($controller) { 
            var _empresa = [{nome: 'a', id: 1, idExterno: '438694'}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.reject({mensagem: 'abc'})
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            _scope.ctrl.init();

            _scope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).not.toHaveBeenCalled();
            expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
        }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', inject(function($controller) {
            var _empresa = [{nome: 'a', id: 1, idExterno: '438694'}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.when({ok: true});
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            _scope.ctrl.init();

            _scope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
        }));

        it('deve buscar apenas uma empresa, buscando com a propriedade passada por parâmetro', inject(function($controller) {
            var _empresa = [{nome: 'a', id: 1, idExterno: _assinanteKoopon.idExterno}];
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.when({ok: true})
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            _scope.ctrl.init('a');

            _rootScope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.getEmpresas).toHaveBeenCalledWith('a');
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
        }));
      });

      fdescribe('escolheEmpresa', function() {
        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', inject(function($controller) {
            var _empresa = [{nome: 'a', id: 1}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.reject({mensagem: 'abc'})
            });
            
            $controller(NOME_CONTROLLER, {$scope: _scope});

            _rootScope.$digest();

            _scope.ctrl.escolheEmpresa(_empresa[0]);

            _rootScope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).not.toHaveBeenCalled();
            expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
        }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', inject(function($controller) { 
            var _empresa = [{nome: 'a', id: 1}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}
            spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.when(_empresaRespostaPassaporte)
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            _scope.ctrl.escolheEmpresa(_empresa[0]);

            _scope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresaRespostaPassaporte);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
          }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok - com procuracao', inject(function($controller) { 
            var _empresas = [{nome: 'a', id: 1}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}

            spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresas);
            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.when(_empresaRespostaPassaporte)
            });

            spyOn(_AltPassaporteProcuracaoService, 'getInfo').and.callFake(function() {
              return _q.when({assinantes: []});
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            spyOn(_scope.ctrl, 'escolheEmpresa').and.callThrough();

            _rootScope.$digest();

            _scope.ctrl.escolheEmpresa(_empresas[0]);

            _rootScope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresas[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresaRespostaPassaporte);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            expect(_scope.ctrl.escolheEmpresa).toHaveBeenCalledWith(_empresas[0]);
        }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok - com procuracao', inject(function($controller) {
            var _empresa = [{nome: 'a', id: 1}];
            var _empresaRespostaPassaporte = {nome: 'a', produtos: [{nome: 'p1'}, {nome: 'p2'}, {nome: 'p3'}]}
            spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);

            spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
              return _q.when(_empresaRespostaPassaporte)
            });

            $controller(NOME_CONTROLLER, {$scope: _scope});

            spyOn(_scope.ctrl, 'escolheEmpresa').and.callThrough();

            _rootScope.$digest();

            _scope.ctrl.escolheEmpresa(_empresa[0]);

            _rootScope.$digest();

            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresaRespostaPassaporte);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            expect(_scope.ctrl.escolheEmpresa).toHaveBeenCalled();
        }));

        it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna 403', inject(function($controller) {
            var _empresa = [{nome: 'a', id: 1}];

            spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
            spyOn(_AltModalService, 'open').and.callFake(angular.noop);

            _httpBackend.expectPOST(URL_BASE, {empresaEscolhida: _empresa[0].id}).respond(403);

            $controller(NOME_CONTROLLER, {$scope: _scope});

            _rootScope.$digest();
            _scope.ctrl.escolheEmpresa(_empresa[0]);

            _httpBackend.flush();
            _rootScope.$digest();

            expect(_AltModalService.open).toHaveBeenCalledWith(ID_MODAL_EMPRESA_INADIMPLENCIA);
        }));

        fit('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna 403 com status de demonstração expirada', inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1}];

          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltModalService, 'open').and.callFake(angular.noop);

          _httpBackend.expectPOST(URL_BASE, {empresaEscolhida: _empresa[0].id}).respond(403, {
            mensagem: 'DEMONSTRACAO_EXPIRADA'
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _rootScope.$digest();
          _scope.ctrl.escolheEmpresa(_empresa[0]);

          _httpBackend.flush();
          _rootScope.$digest();

          expect(_AltModalService.open).toHaveBeenCalledWith(ID_MODAL_EMPRESA_DEMONSTRACAO_EXPIRADA);
      }));
      });
    });

    describe('AltEmpresaEscolhidaController', function() {
      var NOME_CONTROLLER = 'AltEmpresaEscolhidaController as eCtrl';

      describe('criação', function() {
          it('deve ser criada corretamente', inject(function($controller) {
            $controller(NOME_CONTROLLER, {$scope: _scope});
          }));
      })

      describe('onLoad', function(){
          it('deve buscar a empresa corretamente', inject(function($controller) {
              var _daStorage = {a: 1};

              spyOn(_AltKooponEmpresaService, 'getEmpresaEscolhidaDaStorage').and.returnValue(_daStorage);

              $controller(NOME_CONTROLLER, {$scope: _scope});

              expect(_scope.eCtrl.empresaEscolhida).toEqual(_daStorage);
          }));
      });

      describe('$destroy', function() {
        it('deve limpar a informação da empresaEscolhida', inject(function($controller) {
            var _daStorage = {a: 1};

            spyOn(_AltKooponEmpresaService, 'getEmpresaEscolhidaDaStorage').and.returnValue(_daStorage);

            $controller(NOME_CONTROLLER, {$scope: _scope});

            expect(_scope.eCtrl.empresaEscolhida).toEqual(_daStorage);

            _rootScope.$broadcast('$destroy');

            expect(_scope.eCtrl.empresaEscolhida).toBeNull();
        }));
      });
    })

})
