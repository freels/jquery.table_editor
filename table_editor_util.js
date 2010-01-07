function binding(method, scope) {
  for (var i = 2, bound_args = []; i < arguments.length; i++)
    bound_args.push(arguments[i]);

  return function() {
    for (var i = 0, args = []; i < arguments.length; i++)
      args.push(arguments[i]);
    return method.apply(scope, bound_args.concat(args));
  };
}

function escapeRegExp(str) {
  return str.replace(/([.*+?^$|(){}[\]\\])/g, '\\$1');
}
