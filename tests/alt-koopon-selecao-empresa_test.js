"use strict";

describe('alt.koopon.selecao-empresa', function() {
  var _rootScope, _scope, _http, _q, _httpBackend, _locationMock, _xtorage,
      _AltKooponEmpresaService, _AltAlertaFlutuanteService, _AltPassaporteUsuarioLogadoManager,
      _AltPassaporteProcuracaoService, _AltKooponSelecaoEmpresasHelper, _AltModalService,
      _EventoEmpresa, _assinanteKoopon, _assinanteKooponInadimplente, _assinanteKooponNaoPleno, _AltPassaportePublicoResource;

  var ID_KOOPON_EMPRESA, ID_KOOPON_CONTADOR;

  beforeEach(module('alt.koopon.selecao-empresa', function(AltKoopon_BASE_APIProvider) {
    AltKoopon_BASE_APIProvider.url = '/koopon-contador-rest-api/';
  }));

  beforeEach(inject(function($injector) {
    _rootScope = $injector.get('$rootScope');
    _scope = _rootScope.$new();
    _q = $injector.get('$q');
    _http = $injector.get('$http');
    _httpBackend = $injector.get('$httpBackend');
    _xtorage = $injector.get('$xtorage');

    _locationMock = $injector.get('$location');

    ID_KOOPON_EMPRESA = $injector.get('ID_KOOPON_EMPRESA');
    ID_KOOPON_CONTADOR = $injector.get('ID_KOOPON_CONTADOR');

    _AltPassaporteUsuarioLogadoManager = $injector.get('AltPassaporteUsuarioLogadoManager');
    _EventoEmpresa = $injector.get('AltKooponEventoEmpresa');

    _AltAlertaFlutuanteService = $injector.get('AltAlertaFlutuanteService');
    _AltKooponEmpresaService = $injector.get('AltKooponEmpresaService');
    _AltPassaporteProcuracaoService = $injector.get('AltPassaporteProcuracaoService');
    _AltKooponSelecaoEmpresasHelper = $injector.get('AltKooponSelecaoEmpresasHelper');
    _AltPassaportePublicoResource = $injector.get('AltPassaportePublicoResource');
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
      expect(ID_KOOPON_EMPRESA).toEqual('60f1fe1f835b14a3d20ac0f046fac668');
      expect(ID_KOOPON_CONTADOR).toEqual('3c59dc048e8850243be8079a5c74d079');
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

    var URL_BASE = '/koopon-contador-rest-api/assinantes/selecao';

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

      it('deve chamar o endpoint corretamente', function() {
        var _empresa = {id: 1, qqcoisa: true};
        var _empresaCompleta = {id: 1, qqcoisa: true, outraCoisa: false};

        _httpBackend.expectPOST(URL_BASE, {empresaEscolhida: _empresa.id}).respond(200, _empresaCompleta);

        _AltKooponEmpresaService
        .escolhe(_empresa)
        .then(function(emp) {
          expect(emp.id).toBe(_empresaCompleta.id);
          expect(emp.qqcoisa).toBe(_empresaCompleta.qqcoisa);
          expect(emp.outraCoisa).toBe(_empresaCompleta.outraCoisa);
        })
        .catch(function(){expect(true).toBe(false)});

        _httpBackend.flush();

        expect(_rootScope.$broadcast).toHaveBeenCalledWith(_EventoEmpresa.EVENTO_EMPRESA_ESCOLHIDA, _empresa);
      });
    });
  });

  describe('AltKooponPermissaoAssinanteService', function() {
    var _kooponPermissaoAssinanteService, _log;
    beforeEach(inject(function($injector) {
      _kooponPermissaoAssinanteService = $injector.get('AltKooponPermissaoAssinanteService');
      _log = $injector.get('$log');
    }));

    describe('temPermissaoAcesso(idExternoEmpresa)', function() {
      var _respostaTemAcesso;

      describe('- passaporte retorna erro na consulta do assinante -', function() {
        beforeEach(function(done) {
          var idExterno = '12345';
          
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res, rej) {
              rej({erros: [{
                mensagem: 'Houve um erro interno na aplicação. - javax.validation.ValidationException: Código de assinante [12345] fora do padrão, o código deve ter 6, 11 ou 13 caracteres.'
              }]});
            })
          });

          spyOn(_log, 'error');

          _kooponPermissaoAssinanteService.temPermissaoAcesso(idExterno).then(function(resp) {
            _respostaTemAcesso = resp;
            done();
          });
        });
        it('deve considerar empresa SEM permissao de acesso.', function() {
          expect(_respostaTemAcesso).toBe(false);
        });
        it('deve logar informação de erro na consulta ao passaporte.', function() {
          expect(_log.error).toHaveBeenCalledWith('Falha ao obter dados administrativos do assinante 12345 para o produto.');
        });
      });

      describe('- passaporte retorna ok na consulta do assinante -', function() {
        
        describe('- assinante inadimplente CRM -', function() {
          beforeEach(function(done) {
            var idExterno = '12345';
            
            spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
              $promise: new Promise(function(res) {
                res([_assinanteKooponInadimplente]);
              })
            });
  
            _kooponPermissaoAssinanteService.temPermissaoAcesso(idExterno).then(function(resp) {
              _respostaTemAcesso = resp;
              done();
            });
          });
          it('deve considerar empresa SEM permissao de acesso.', function() {
            expect(_respostaTemAcesso).toBe(false);
          });
        })
        describe('- assinante não-pleno no status Bimer -', function() {
          beforeEach(function(done) {
            var idExterno = '12345';
            
            spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
              $promise: new Promise(function(res) {
                res([_assinanteKooponNaoPleno]);
              })
            });
  
            _kooponPermissaoAssinanteService.temPermissaoAcesso(idExterno).then(function(resp) {
              _respostaTemAcesso = resp;
              done();
            });
          });
          it('deve considerar empresa SEM permissao de acesso.', function() {
            expect(_respostaTemAcesso).toBe(false);
          });
        })
      });
    });
  });

  describe('controller helper', function() {
    beforeEach(function() {
        spyOn(_locationMock, 'path').and.returnValue('/');
    });

    describe('escolheEmpresaSemProcuracao', function() {
      it('deve chamar o metodo com os parâmetros corretos', function() {
        var _empresa = {id: 1};

        spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
          return _q.when({assinantes: []});
        });

        _AltKooponSelecaoEmpresasHelper.escolheEmpresaSemProcuracao(_empresa);

        _rootScope.$digest();

        expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa);
      });
    });
  });

  describe('controller', function() {
    beforeEach(function() {
        spyOn(_locationMock, 'path').and.returnValue('/');
    });

    var NOME_CONTROLLER = 'AltKooponSelecaoEmpresasController as akseCtrl';

    describe('criação', function() {
      it('deve criar a controller corretamente', inject(function($controller) {
        $controller(NOME_CONTROLLER, {$scope: _scope});
      }));

      it('deve ter empresas como um array vazio', inject(function($controller) {
        $controller(NOME_CONTROLLER, {$scope: _scope});

        expect(_scope.akseCtrl.empresas).toEqual([]);
      }));
    });

    describe('init', function() {
      it('deve tentar buscar as empresas, mas o serviço retorna undefined', inject(function ($controller) {
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(undefined);

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _scope.akseCtrl.init();

        expect(_scope.akseCtrl.empresas).toEqual([]);
      }));

      it('deve buscar as empresas corretamente, duas são preenchidas', inject(function ($controller) {
        var _empresas = [{id: 1, nome: 'a'}, {id: 2, nome: 'b'}];

        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresas);

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _scope.akseCtrl.init();

        expect(_scope.akseCtrl.empresas).toEqual(_empresas);
        expect(_locationMock.path).not.toHaveBeenCalled();
      }));

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', function(done) { 
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1, idExterno: '438694'}];
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res, rej) {
              rej({mensagem: 'abc'});
            });
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.akseCtrl.init();

          _scope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).not.toHaveBeenCalled();
            expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
            done();
          })
        });
      });

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', function(done) {
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1, idExterno: '438694'}];
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res) {
              res({ok: true});
            });
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.akseCtrl.init();

          _scope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            done();
          });
        });
      });

      it('deve buscar apenas uma empresa, buscando com a propriedade passada por parâmetro', function(done) {
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1, idExterno: _assinanteKoopon.idExterno}];
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res) {
              res({ok: true});
            })
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.akseCtrl.init('a');

          _rootScope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.getEmpresas).toHaveBeenCalledWith('a');
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            done();
          });
        });
      });
    });

    describe('escolheEmpresa', function() {
      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', function(done) {
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1}];
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res, rej) {
              rej({mensagem: 'abc'});
            });
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _rootScope.$digest();

          _scope.akseCtrl.escolheEmpresa(_empresa[0]);

          _rootScope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).not.toHaveBeenCalled();
            expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
            done();
          });
        });
      });

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', function(done) { 
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1}];
          spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res) {res({ok: true})});
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          _scope.akseCtrl.escolheEmpresa(_empresa[0]);

          _scope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            done();
          });
        });
      });

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok - com procuracao', function(done) { 
        inject(function($controller) {
          var _empresas = [{nome: 'a', id: 1}];

          spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresas);
          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res) {res({ok: true})});
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          spyOn(_AltPassaporteProcuracaoService, 'getInfo').and.callFake(function() {
            return _q.when({assinantes: []});
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          spyOn(_scope.akseCtrl, 'escolheEmpresa').and.callThrough();

          _rootScope.$digest();

          _scope.akseCtrl.escolheEmpresa(_empresas[0]);

          _rootScope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresas[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresas[0]);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            expect(_scope.akseCtrl.escolheEmpresa).toHaveBeenCalledWith(_empresas[0]);
            done();
          });
        });
      });

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok - com procuracao', function(done) {
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1}];
          spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);

          spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
            return new Promise(function(res) {res({ok:true})});
          });
          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKoopon
              ]);
            })
          });

          $controller(NOME_CONTROLLER, {$scope: _scope});

          spyOn(_scope.akseCtrl, 'escolheEmpresa').and.callThrough();

          _rootScope.$digest();

          _scope.akseCtrl.escolheEmpresa(_empresa[0]);

          _rootScope.$digest();

          setTimeout(function() {
            expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
            expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresa[0]);
            expect(_locationMock.path).toHaveBeenCalledWith('/');
            expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
            expect(_scope.akseCtrl.escolheEmpresa).toHaveBeenCalled();
            done();
          });
        });
      });

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok - sem permissao acesso', function(done) {
        inject(function($controller) {
          var _empresa = [{nome: 'a', id: 1}];
          spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
          spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);

          spyOn(_AltPassaportePublicoResource, 'query').and.returnValue({
            $promise: new Promise(function(res) {
              res([
                _assinanteKooponInadimplente
              ]);
            })
          });
          spyOn(_AltModalService, 'open').and.callFake(angular.noop);

          var ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO = '#koopon-core-modal-empresa-pendencias-administrativas';

          $controller(NOME_CONTROLLER, {$scope: _scope});

          spyOn(_scope.akseCtrl, 'escolheEmpresa').and.callThrough();

          _rootScope.$digest();

          _scope.akseCtrl.escolheEmpresa(_empresa[0]);

          _rootScope.$digest();

          setTimeout(function() {
            expect(_AltModalService.open).toHaveBeenCalledWith(ID_MODAL_EMPRESA_SEM_PERMISSAO_ACESSO, {
              backdrop: 'static'
            });
            done();
          });
        });
      });
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
