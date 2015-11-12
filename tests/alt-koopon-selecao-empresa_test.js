"use strict";

describe('alt.koopon.selecao-empresa', function() {
  var _rootScope, _scope, _http, _q, _httpBackend, _locationMock, _xtorage,
  _AltKooponEmpresaService, _AltAlertaFlutuanteService, _AltPassaporteUsuarioLogadoManager;

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

    _AltPassaporteUsuarioLogadoManager = $injector.get('AltPassaporteUsuarioLogadoManager');
    _AltAlertaFlutuanteService = $injector.get('AltAlertaFlutuanteService');
    _AltKooponEmpresaService = $injector.get('AltKooponEmpresaService');

    spyOn(_locationMock, 'path').and.callFake(angular.noop);
    spyOn(_AltAlertaFlutuanteService, 'exibe').and.callFake(angular.noop);

    spyOn(_xtorage, 'save').and.callFake(angular.noop);
    spyOn(_xtorage, 'get').and.callFake(angular.noop);
  }));

  describe('interceptor', function() {
    var URL = '/api/qqcoisa';

    describe('seleção empresa', function() {
      it('não deve redirecionar, resposta ok - não deve chamar troca de rota', function() {
        _httpBackend.expectGET(URL).respond(200);

        _http.get(URL);

        expect(_locationMock.path).not.toHaveBeenCalled();
      });

      it('deve retornar uma promessa com a rejeição do servidor - 400 - não deve chamar troca de rota', function() {
        _httpBackend.expectGET(URL).respond(400);

        _http.get(URL);

        _httpBackend.flush();
        expect(_locationMock.path).not.toHaveBeenCalled();
      });

      it('deve retornar uma promessa com a rejeição do servidor - 403 - não deve chamar troca de rota', function() {
        _httpBackend.expectGET(URL).respond(403, {deveSelecionarEmpresa: false});

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).not.toHaveBeenCalled();
      });

      it('deve retornar uma promessa com a rejeição do servidor - 403 - deve chamar troca de rota', function() {
        _httpBackend.expectGET(URL).respond(403, {deveSelecionarEmpresa: true});

        _http.get(URL);

        _httpBackend.flush();

        expect(_locationMock.path).toHaveBeenCalledWith('/selecao-empresas');
      });
    });
  });

  describe('service', function() {
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
    });

    describe('getEmpresaEscolhidaDaStorage', function() {
      it('deve chamar o método com os parâmetros corretos', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.getEmpresaEscolhidaDaStorage();

        expect(_xtorage.get).toHaveBeenCalledWith('emp_escolhida');
      });
    });

    describe('salvaNaStorageEmpresaEscolhida', function() {
      it('deve chamar o método com os parâmetros corretos', function() {
        var _emp = {a: true};

        _AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida(_emp);

        expect(_xtorage.save).toHaveBeenCalledWith('emp_escolhida', _emp);
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
      });
    });
  });

  describe('controller', function() {
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

    describe('onLoad', function() {
      it('deve tentar buscar as empresas, mas o serviço retorna undefined', inject(function ($controller) {
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(undefined);

        $controller(NOME_CONTROLLER, {$scope: _scope});

        expect(_scope.akseCtrl.empresas).toEqual([]);
      }));

      it('deve buscar as empresas corretamente, duas são preenchidas', inject(function ($controller) {
        var _empresas = [{id: 1, nome: 'a'}, {id: 2, nome: 'b'}];

        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresas);

        $controller(NOME_CONTROLLER, {$scope: _scope});

        expect(_scope.akseCtrl.empresas).toEqual(_empresas);
        expect(_locationMock.path).not.toHaveBeenCalled();
      }));

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', inject(function($controller) {
        var _empresa = [{nome: 'a', id: 1}];
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
        spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
          return _q.reject({mensagem: 'abc'});
        });

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _rootScope.$digest();

        expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
        expect(_locationMock.path).not.toHaveBeenCalled();
        expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
      }));

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', inject(function($controller) {
        var _empresa = [{nome: 'a', id: 1}];
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
        spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
          return _q.when({ok: true});
        });

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _rootScope.$digest();

        expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
        expect(_locationMock.path).toHaveBeenCalledWith('/');
        expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
      }));
    });

    describe('escolheEmpresa', function() {
      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado, mas service retorna erro', inject(function($controller) {
        var _empresa = [{nome: 'a', id: 1}];
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
        spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
          return _q.reject({mensagem: 'abc'});
        });

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _rootScope.$digest();

        _scope.akseCtrl.escolheEmpresa(_empresa[0]);

        _rootScope.$digest();

        expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
        expect(_locationMock.path).not.toHaveBeenCalled();
        expect(_AltAlertaFlutuanteService.exibe).toHaveBeenCalledWith({msg: 'abc'});
      }));

      it('deve buscar apenas uma empresa, AltKooponEmpresaService.escolhe deve ser ativado e service retorna ok', inject(function($controller) {
        var _empresa = [{nome: 'a', id: 1}];
        spyOn(_AltKooponEmpresaService, 'salvaNaStorageEmpresaEscolhida').and.callFake(angular.noop);
        spyOn(_AltKooponEmpresaService, 'getEmpresas').and.returnValue(_empresa);
        spyOn(_AltKooponEmpresaService, 'escolhe').and.callFake(function() {
          return _q.when({ok: true});
        });

        $controller(NOME_CONTROLLER, {$scope: _scope});

        _rootScope.$digest();

        _scope.akseCtrl.escolheEmpresa(_empresa[0]);

        _rootScope.$digest();

        expect(_AltKooponEmpresaService.escolhe).toHaveBeenCalledWith(_empresa[0]);
        expect(_AltKooponEmpresaService.salvaNaStorageEmpresaEscolhida).toHaveBeenCalledWith(_empresa[0]);
        expect(_locationMock.path).toHaveBeenCalledWith('/');
        expect(_AltAlertaFlutuanteService.exibe).not.toHaveBeenCalled();
      }));
    });
  });
})
