import React from 'react';

const SvgMock = React.forwardRef((props, ref) => React.createElement('svg', { ref, ...props }));

SvgMock.displayName = 'SvgMock';

export default SvgMock;